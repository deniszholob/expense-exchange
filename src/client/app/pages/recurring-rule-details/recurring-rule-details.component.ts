// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormField,
  applyEach,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { LucideCheck, LucidePlus, LucideTrash2 } from '@lucide/angular';
import {
  RecurrenceCadence,
  RecurringTransactionType,
  type CreateRecurringRuleDto,
  type RecurringRuleDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { FormFieldComponent } from 'src/client/app/components/forms/form-field/form-field.component';
import { DateInputComponent } from 'src/client/app/components/forms/date-input/date-input.component';
import { MultiSelectComponent } from 'src/client/app/components/forms/multi-select/multi-select.component';
import { SegmentedControlComponent } from 'src/client/app/components/forms/segmented-control/segmented-control.component';
import { PageRoute } from 'src/client/app/app.info';
import { PageLayoutComponent } from 'src/client/app/layout/page-layout/page-layout.component';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { getHttpErrorMessage } from 'src/client/app/shared/http-error-message';
import { normalizeDateInput } from 'src/client/app/shared/date-input.util';
import { RecurringStateService } from 'src/client/app/shared/recurring-state.service';
import {
  getSessionFormDraftKey,
  readSessionFormDraft,
  removeSessionFormDraft,
  saveSessionFormDraft,
} from 'src/client/app/shared/session-form-draft';
// #endregion

// #region Types and Constants
interface RecurringRuleFormValue {
  type: CreateRecurringRuleDto['type'];
  name: string;
  prices: RecurringPriceFormValue[];
  targetParticipantId: string;
  beneficiaryParticipantIds: string[];
  cadence: RecurrenceCadence;
  endDate: string;
  isAutopay: boolean;
  note: string;
}

interface RecurringPriceFormValue {
  effectiveDate: string;
  payDate: string;
  amount: number | null;
}

const CADENCE_LABELS: Record<RecurrenceCadence, string> = {
  [RecurrenceCadence.Weekly]: 'Weekly',
  [RecurrenceCadence.Biweekly]: 'Every two weeks',
  [RecurrenceCadence.Monthly]: 'Monthly',
  [RecurrenceCadence.Biannual]: 'Twice a year',
  [RecurrenceCadence.Yearly]: 'Yearly',
};

const CADENCE_OPTIONS = Object.values(RecurrenceCadence).map((value) => ({
  value,
  label: CADENCE_LABELS[value],
}));

const TRANSACTION_OPTIONS = Object.values(RecurringTransactionType).map(
  (value) => ({ value, label: value }),
);

const AUTOPAY_OPTIONS = [
  { value: false, label: 'Off' },
  { value: true, label: 'On' },
] as const;
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recurring-rule-details',
  templateUrl: './recurring-rule-details.component.html',
  host: { class: 'contents' },
  imports: [
    FormField,
    FormFieldComponent,
    DateInputComponent,
    MultiSelectComponent,
    SegmentedControlComponent,
    PageLayoutComponent,
    LucideCheck,
    LucidePlus,
    LucideTrash2,
  ],
})
export class RecurringRuleDetailsComponent {
  protected readonly appService = inject(AppService);
  protected readonly recurringState = inject(RecurringStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly PageRoute = PageRoute;
  protected readonly RecurringTransactionType = RecurringTransactionType;
  protected readonly DataSource = DataSource;
  private readonly $routeParams = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? undefined)),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? undefined },
  );
  protected readonly $ruleId = computed(() => this.$routeParams());
  protected readonly $rule = computed(() =>
    this.$ruleId()
      ? this.recurringState.$rules().find((rule) => rule.id === this.$ruleId())
      : undefined,
  );
  protected readonly $existingOccurrenceCount = computed(
    () =>
      this.recurringState
        .$occurrences()
        .filter((occurrence) => occurrence.ruleId === this.$ruleId()).length,
  );
  protected readonly $isEditing = computed(() => this.$ruleId() !== undefined);
  protected readonly $notFound = computed(
    () =>
      this.$isEditing() &&
      this.recurringState.$hasLoaded() &&
      !this.recurringState.$isLoading() &&
      !this.recurringState.$error() &&
      this.$rule() === undefined,
  );
  protected readonly $memberOptions = computed(() =>
    this.appService.$participants().map((participant) => ({
      id: participant.id,
      name: participant.id.startsWith('external:')
        ? `${participant.name} (External)`
        : participant.name,
    })),
  );
  protected readonly $typeOptions = TRANSACTION_OPTIONS;
  protected readonly $autopayOptions = AUTOPAY_OPTIONS;
  protected readonly $cadenceOptions = CADENCE_OPTIONS;
  protected readonly $actionError = signal<string | undefined>(undefined);
  protected readonly $ruleValue = linkedSignal(() => {
    const rule = this.$rule();
    const signedInUserId = this.appService.$currentUser()?.id ?? '';
    const currentUserId = this.appService
      .$participants()
      .some((participant) => participant.id === signedInUserId)
      ? signedInUserId
      : '';
    return rule ? toFormValue(rule) : createEmptyRuleForm(currentUserId);
  });
  private readonly $draftKey = computed(() => {
    const userId = this.appService.$currentUser()?.id;
    if (!userId || this.appService.$dataSource() !== DataSource.RemoteApi)
      return undefined;
    return getSessionFormDraftKey(
      'recurring-rule',
      this.appService.$dataSource(),
      userId,
      this.$ruleId() ?? 'new',
    );
  });
  private readonly $hydratedDraftKey = signal<string | undefined>(undefined);
  protected readonly $ruleForm = form(this.$ruleValue, (path) => {
    required(path.type);
    required(path.name);
    minLength(path.name, 2);
    required(path.targetParticipantId);
    minLength(path.beneficiaryParticipantIds, 1, {
      message: 'Select at least one beneficiary.',
    });
    minLength(path.prices, 1, {
      message: 'Add at least one dated price entry.',
    });
    required(path.cadence);
    applyEach(path.prices, (price) => {
      required(price.effectiveDate);
    });
  });

  public constructor() {
    effect(() => {
      const key = this.$draftKey();
      if (!key || (this.$isEditing() && !this.$rule())) return;
      if (this.$hydratedDraftKey() === key) return;

      const savedDraft = readSessionFormDraft(key, isRecurringRuleFormValue);
      if (savedDraft) this.$ruleValue.set(savedDraft);
      this.$hydratedDraftKey.set(key);
    });

    effect(() => {
      const key = this.$draftKey();
      if (!key || this.$hydratedDraftKey() !== key) return;
      if (this.$isEditing() && !this.$rule()) return;
      saveSessionFormDraft(key, this.$ruleValue());
    });
  }

  protected async saveRule(event: Event): Promise<void> {
    event.preventDefault();
    const value = this.$ruleValue();
    if (value.endDate && !normalizeDateInput(value.endDate)) {
      this.$actionError.set(
        'End date must be a valid date in YYYY/MM/DD format.',
      );
      return;
    }
    if (
      value.prices.some((price) => {
        const effectiveDate = normalizeDateInput(price.effectiveDate);
        const payDate = price.payDate
          ? normalizeDateInput(price.payDate)
          : undefined;
        return (
          !effectiveDate ||
          (price.payDate !== '' && !payDate) ||
          (payDate !== undefined && payDate < effectiveDate) ||
          (price.amount !== null && price.amount <= 0)
        );
      })
    ) {
      this.$actionError.set(
        'Each price needs a valid effective date and a positive amount when specified.',
      );
      return;
    }
    if (this.$ruleForm().invalid()) return;
    this.$actionError.set(undefined);
    try {
      const input = toCreateRule(value);
      const id = this.$ruleId();
      if (id) {
        if (
          this.$existingOccurrenceCount() > 0 &&
          !window.confirm(
            'Saving this rule will apply its changes to all existing occurrences. Schedule edits can add or remove occurrences, change recorded amounts and pay dates, or reset payment status. Continue?',
          )
        )
          return;
        await this.recurringState.updateRule(id, input);
      } else await this.recurringState.createRule(input);
      await this.router.navigate(['/', PageRoute.Recurring]);
      const draftKey = this.$draftKey();
      if (draftKey) removeSessionFormDraft(draftKey);
    } catch (error: unknown) {
      this.$actionError.set(
        getHttpErrorMessage(error, 'Unable to save recurring rule.'),
      );
    }
  }

  protected addPrice(): void {
    const today = getLocalDate();
    this.$ruleValue.update((rule) => ({
      ...rule,
      prices: [
        ...rule.prices,
        { effectiveDate: today, payDate: '', amount: null },
      ],
    }));
  }

  protected removePrice(index: number): void {
    this.$ruleValue.update((rule) => ({
      ...rule,
      prices: rule.prices.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  protected cancel(): void {
    void this.router.navigate(['/', PageRoute.Recurring]);
  }
}
// #endregion

// #region Helpers
function createEmptyRuleForm(currentUserId: string): RecurringRuleFormValue {
  return {
    type: RecurringTransactionType.Expense,
    name: '',
    targetParticipantId: currentUserId,
    beneficiaryParticipantIds: currentUserId ? [currentUserId] : [],
    cadence: RecurrenceCadence.Monthly,
    prices: [{ effectiveDate: getLocalDate(), payDate: '', amount: null }],
    endDate: '',
    isAutopay: true,
    note: '',
  };
}

function toFormValue(rule: RecurringRuleDto): RecurringRuleFormValue {
  return {
    type: rule.type,
    name: rule.name,
    prices: rule.prices.map((price) => ({
      effectiveDate: price.effectiveDate,
      payDate:
        price.payDate === price.effectiveDate ? '' : (price.payDate ?? ''),
      amount: price.amount ?? null,
    })),
    targetParticipantId: rule.targetParticipantId,
    beneficiaryParticipantIds: [...rule.beneficiaryParticipantIds],
    cadence: rule.cadence,
    endDate: rule.endDate ?? '',
    isAutopay: rule.isAutopay,
    note: rule.note ?? '',
  };
}

function toCreateRule(value: RecurringRuleFormValue): CreateRecurringRuleDto {
  const endDate = value.endDate ? normalizeDateInput(value.endDate) : undefined;
  if (value.endDate && !endDate)
    throw new Error('End date must be a valid calendar date.');
  const prices = value.prices.map((price) => {
    const effectiveDate = normalizeDateInput(price.effectiveDate);
    const payDate = price.payDate
      ? normalizeDateInput(price.payDate)
      : undefined;
    if (
      !effectiveDate ||
      (price.payDate !== '' && !payDate) ||
      (payDate !== undefined && payDate < effectiveDate) ||
      (price.amount !== null && price.amount <= 0)
    )
      throw new Error(
        'Each price needs valid dates and a positive amount when specified.',
      );
    return {
      effectiveDate,
      ...(payDate === undefined ? {} : { payDate }),
      ...(price.amount === null ? {} : { amount: price.amount }),
    };
  });
  if (
    new Set(prices.map((price) => price.effectiveDate)).size !== prices.length
  )
    throw new Error('Only one price can be set for each date.');
  if (prices.length === 0)
    throw new Error('Add at least one dated price entry.');
  const firstStatementDate = prices[0]!.effectiveDate;
  if (endDate && endDate < firstStatementDate)
    throw new Error('End date must be on or after the first price date.');
  return {
    type: value.type,
    name: value.name.trim(),
    prices: [...prices].sort((first, second) =>
      first.effectiveDate.localeCompare(second.effectiveDate),
    ),
    targetParticipantId: value.targetParticipantId,
    beneficiaryParticipantIds: value.beneficiaryParticipantIds,
    cadence: value.cadence,
    ...(endDate ? { endDate } : {}),
    isAutopay: value.isAutopay,
    ...(value.note.trim() ? { note: value.note.trim() } : {}),
  };
}

function getLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isRecurringRuleFormValue(
  value: unknown,
): value is RecurringRuleFormValue {
  if (!isRecord(value)) return false;
  const draft = value;
  draft['targetParticipantId'] ??= draft['targetUserId'];
  draft['beneficiaryParticipantIds'] ??= draft['beneficiaryUserIds'];
  delete draft['targetUserId'];
  delete draft['beneficiaryUserIds'];
  return (
    Object.values(RecurringTransactionType).some(
      (type) => type === draft['type'],
    ) &&
    typeof draft['name'] === 'string' &&
    Array.isArray(draft['prices']) &&
    draft['prices'].every(
      (price: unknown) =>
        isRecord(price) &&
        typeof price['effectiveDate'] === 'string' &&
        (price['payDate'] === undefined ||
          typeof price['payDate'] === 'string') &&
        (price['amount'] === null ||
          (typeof price['amount'] === 'number' &&
            Number.isFinite(price['amount']))),
    ) &&
    typeof draft['targetParticipantId'] === 'string' &&
    Array.isArray(draft['beneficiaryParticipantIds']) &&
    draft['beneficiaryParticipantIds'].every(
      (userId: unknown) => typeof userId === 'string',
    ) &&
    Object.values(RecurrenceCadence).some(
      (cadence) => cadence === draft['cadence'],
    ) &&
    typeof draft['endDate'] === 'string' &&
    typeof draft['isAutopay'] === 'boolean' &&
    typeof draft['note'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion
