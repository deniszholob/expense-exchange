// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { LucideCheck } from '@lucide/angular';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  GroupMemberDto,
  CreateTransactionDto,
  TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { MultiSelectComponent } from '../forms/multi-select/multi-select.component';
import { SegmentedControlComponent } from '../forms/segmented-control/segmented-control.component';
import { DateInputComponent } from '../forms/date-input/date-input.component';
import { TRANSACTION_TYPE_INFO_OPTIONS } from 'src/client/app/shared/transaction-type.info';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { normalizeDateInput } from 'src/client/app/shared/date-input.util';
import {
  getSessionFormDraftKey,
  readSessionFormDraft,
  saveSessionFormDraft,
} from 'src/client/app/shared/session-form-draft';
// #endregion

// #region Types
type TransactionFormValue = Omit<
  CreateTransactionDto,
  'note' | 'linkedTransactionId'
> & {
  note: string;
  linkedTransactionId: string;
};
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    FormField,
    FormFieldComponent,
    LucideCheck,
    MultiSelectComponent,
    SegmentedControlComponent,
    DateInputComponent,
  ],
})
export class TransactionDetailsComponent {
  public readonly currentUser = input<GroupMemberDto>();
  public readonly participants =
    input.required<readonly { id: string; name: string }[]>();
  public readonly transaction = input<TransactionDto>();
  public readonly expenses = input<TransactionDto[]>([]);
  public readonly initialType = input<TransactionType>(TransactionType.Expense);
  public readonly $dataSource = input(DataSource.RemoteApi);
  public readonly save = output<CreateTransactionDto>();
  public readonly cancelRequested = output<void>();

  protected readonly TransactionType = TransactionType;
  protected readonly $isEditing = computed(
    () => this.transaction() !== undefined,
  );
  protected readonly $typeOptions = computed(() =>
    TRANSACTION_TYPE_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
      disabled: this.$isEditing(),
    })),
  );
  protected readonly $actionError = signal<string | undefined>(undefined);
  protected readonly $isExpense = computed(
    () => this.$transactionData().type === TransactionType.Expense,
  );
  protected readonly $isRefund = computed(
    () => this.$transactionData().type === TransactionType.Refund,
  );
  protected readonly $shareOptions = computed(() => {
    return this.participants().map((participant) => ({
      ...participant,
      name: participant.id.startsWith('external:')
        ? `${participant.name} (External)`
        : participant.name,
    }));
  });
  protected participantLabel(participant: {
    id: string;
    name: string;
  }): string {
    return participant.id.startsWith('external:')
      ? `${participant.name} (External)`
      : participant.name;
  }
  protected readonly $transactionData = linkedSignal<TransactionFormValue>(
    () => {
      const transaction = this.transaction();
      const today = new Date().toISOString().slice(0, 10);
      const currentUserId = this.currentUser()?.id ?? '';
      const defaultUserId = this.participants().some(
        (participant) => participant.id === currentUserId,
      )
        ? currentUserId
        : '';

      if (transaction)
        return {
          type: transaction.type,
          amount: transaction.amount,
          name: transaction.name,
          postDate: transaction.postDate,
          completeDate: transaction.completeDate,
          targetParticipantId: transaction.targetParticipantId,
          beneficiaryParticipantIds: transaction.beneficiaryParticipantIds,
          note: transaction.note ?? '',
          linkedTransactionId: transaction.linkedTransactionId ?? '',
        };

      return {
        type: this.initialType(),
        amount: 0,
        name: '',
        postDate: today,
        completeDate: today,
        targetParticipantId: defaultUserId,
        beneficiaryParticipantIds: defaultUserId ? [defaultUserId] : [],
        note: '',
        linkedTransactionId: '',
      };
    },
  );
  protected readonly $form = form(this.$transactionData, (path) => {
    required(path.name);
    minLength(path.name, 2);
    required(path.amount);
    min(path.amount, 0.01);
    required(path.postDate);
    required(path.completeDate);
    required(path.targetParticipantId);
    minLength(path.beneficiaryParticipantIds, 1, {
      message: 'Select at least one person who benefits from this transaction.',
    });
  });

  private readonly $draftKey = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) return undefined;
    return getSessionFormDraftKey(
      'transaction',
      this.$dataSource(),
      userId,
      this.transaction()?.id ?? `new-${this.initialType()}`,
    );
  });
  private readonly $hydratedDraftKey = signal<string | undefined>(undefined);

  public constructor() {
    effect(() => {
      const key = this.$draftKey();
      if (!key || (this.$isEditing() && !this.transaction())) return;
      if (this.$hydratedDraftKey() === key) return;

      const draft = readSessionFormDraft(key, isTransactionFormValue);
      if (draft) this.$transactionData.set(draft);
      this.$hydratedDraftKey.set(key);
    });

    effect(() => {
      const key = this.$draftKey();
      if (!key || this.$hydratedDraftKey() !== key) return;
      if (this.$isEditing() && !this.transaction()) return;
      saveSessionFormDraft(key, this.$transactionData());
    });
  }

  protected onSaveTransaction(event: Event): void {
    event.preventDefault();
    const value = this.$transactionData();
    const postDate = normalizeDateInput(value.postDate);
    const completeDate = normalizeDateInput(value.completeDate);
    if (!postDate || !completeDate) {
      this.$actionError.set('Enter valid dates in YYYY/MM/DD format.');
      return;
    }
    if (this.$form().invalid()) return;
    this.$actionError.set(undefined);
    this.save.emit({
      type: value.type,
      amount: value.amount,
      name: value.name,
      postDate,
      completeDate,
      targetParticipantId: value.targetParticipantId,
      beneficiaryParticipantIds: value.beneficiaryParticipantIds,
      ...(value.note ? { note: value.note } : {}),
      ...(this.$isRefund() && value.linkedTransactionId
        ? { linkedTransactionId: value.linkedTransactionId }
        : {}),
    });
  }

  protected onCancel(): void {
    this.cancelRequested.emit();
  }
}
// #endregion

// #region Helpers
function isTransactionFormValue(value: unknown): value is TransactionFormValue {
  if (!isRecord(value)) return false;
  const draft = value;
  draft['targetParticipantId'] ??= draft['targetUserId'];
  draft['beneficiaryParticipantIds'] ??= draft['beneficiaryUserIds'];
  delete draft['targetUserId'];
  delete draft['beneficiaryUserIds'];
  return (
    Object.values(TransactionType).some((type) => type === draft['type']) &&
    typeof draft['amount'] === 'number' &&
    Number.isFinite(draft['amount']) &&
    typeof draft['name'] === 'string' &&
    typeof draft['postDate'] === 'string' &&
    typeof draft['completeDate'] === 'string' &&
    typeof draft['targetParticipantId'] === 'string' &&
    Array.isArray(draft['beneficiaryParticipantIds']) &&
    draft['beneficiaryParticipantIds'].every(
      (userId: unknown) => typeof userId === 'string',
    ) &&
    typeof draft['note'] === 'string' &&
    typeof draft['linkedTransactionId'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion
