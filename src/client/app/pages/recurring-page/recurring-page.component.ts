// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideCalendarClock,
  LucideCircleCheck,
  LucideCircleDashed,
  LucideChevronDown,
  LucideCircleAlert,
  LucidePencil,
} from '@lucide/angular';
import {
  RecurrenceCadence,
  RecurringTransactionType,
  type MarkRecurringOccurrencePaidDto,
  type RecurringOccurrenceDto,
  type RecurringRuleDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { DataTableComponent } from 'src/client/app/components/data-table/data-table.component';
import { TableColumnPin } from 'src/client/app/components/data-table/data-table.model';
import type {
  CellTemplateContext,
  ColDef,
  TableBaseData,
  TableRowAction,
  TableRowsReordered,
} from 'src/client/app/components/data-table/data-table.model';
import { PageRoute, ROUTE_KEYWORDS } from 'src/client/app/app.info';
import { PageLayoutComponent } from 'src/client/app/layout/page-layout/page-layout.component';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { getHttpErrorMessage } from 'src/client/app/shared/http-error-message';
import { RecurringStateService } from 'src/client/app/shared/recurring-state.service';
import { RecurringOccurrencePaymentComponent } from 'src/client/app/pages/recurring-page/recurring-occurrence-payment/recurring-occurrence-payment.component';
// #endregion

// #region Types and Constants
interface RecurringRuleRow extends TableBaseData {
  readonly name: string;
  readonly type: RecurringTransactionType;
  readonly prices: string;
  readonly cadence: string;
  readonly targetParticipant: string;
  readonly paymentMode: string;
  readonly beneficiaries: readonly RecurringBeneficiary[];
  readonly activePeriod: string;
  readonly occurrenceCount: number;
  readonly attentionCount: number;
  readonly isDone: boolean;
  readonly rule: RecurringRuleDto;
  readonly canManage: boolean;
}

interface RecurringBeneficiary {
  readonly id: string;
  readonly name: string;
}

interface OpenOccurrenceGroup {
  readonly ruleId: string;
  readonly name: string;
  readonly occurrences: readonly RecurringOccurrenceView[];
}

interface RecurringOccurrenceView {
  readonly occurrence: RecurringOccurrenceDto;
  readonly isAmountEditable: boolean;
  readonly isPayDateEditable: boolean;
  readonly isFullyAutomated: boolean;
}

const CADENCE_LABELS: Record<RecurrenceCadence, string> = {
  [RecurrenceCadence.Weekly]: 'Weekly',
  [RecurrenceCadence.Biweekly]: 'Every two weeks',
  [RecurrenceCadence.Monthly]: 'Monthly',
  [RecurrenceCadence.Biannual]: 'Twice a year',
  [RecurrenceCadence.Yearly]: 'Yearly',
};
const RECURRING_RULE_ORDER_STORAGE_KEY =
  'expense-exchange.recurring-rule-order';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recurring-page',
  templateUrl: './recurring-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    DataTableComponent,
    PageLayoutComponent,
    RecurringOccurrencePaymentComponent,
    LucideCalendarClock,
    LucideCircleCheck,
    LucideCircleDashed,
    LucideChevronDown,
    LucideCircleAlert,
    LucidePencil,
  ],
})
export class RecurringPageComponent {
  protected readonly $actionsPinSide = TableColumnPin.Right;
  protected readonly appService = inject(AppService);
  protected readonly recurringState = inject(RecurringStateService);
  protected readonly RecurringTransactionType = RecurringTransactionType;
  protected readonly DataSource = DataSource;
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly $routeParams = toSignal(this.activatedRoute.paramMap, {
    initialValue: this.activatedRoute.snapshot.paramMap,
  });
  protected readonly $actionError = signal<string | undefined>(undefined);
  protected readonly $rulePendingDeletion = signal<
    RecurringRuleDto | undefined
  >(undefined);
  protected readonly $isDeletingRule = signal(false);
  protected readonly $ruleOrder = signal<readonly string[]>(readRuleOrder());
  protected readonly $submittingOccurrenceId = signal<string | undefined>(
    undefined,
  );
  protected readonly $editingOccurrenceId = signal<string | undefined>(
    undefined,
  );
  protected readonly $selectedOccurrenceRuleId = computed(
    () => this.$routeParams().get('id') ?? undefined,
  );
  protected readonly $openOccurrenceGroups = computed<
    readonly OpenOccurrenceGroup[]
  >(() => {
    const selectedRuleId = this.$selectedOccurrenceRuleId();
    const groups = new Map<string, RecurringOccurrenceView[]>();
    const openOccurrences = this.recurringState
      .$occurrences()
      .filter(
        (occurrence) =>
          !occurrence.isPaid &&
          (!selectedRuleId || occurrence.ruleId === selectedRuleId),
      )
      .sort((first, second) =>
        first.statementDate.localeCompare(second.statementDate),
      )
      .map(toOccurrenceView);

    for (const item of openOccurrences) {
      const group = groups.get(item.occurrence.ruleId) ?? [];
      group.push(item);
      groups.set(item.occurrence.ruleId, group);
    }

    return [...groups.entries()].map(([ruleId, occurrences]) => ({
      ruleId,
      name: occurrences[0]!.occurrence.name,
      occurrences,
    }));
  });
  protected readonly $completedOccurrences = computed(() => {
    const selectedRuleId = this.$selectedOccurrenceRuleId();
    return this.recurringState
      .$occurrences()
      .filter(
        (occurrence) =>
          occurrence.isPaid &&
          (!selectedRuleId || occurrence.ruleId === selectedRuleId),
      )
      .sort((first, second) => second.payDate.localeCompare(first.payDate))
      .map(toOccurrenceView);
  });
  protected readonly $ruleRows = computed<readonly RecurringRuleRow[]>(() => {
    const occurrenceCountByRule = new Map<string, number>();
    for (const occurrence of this.recurringState.$occurrences()) {
      occurrenceCountByRule.set(
        occurrence.ruleId,
        (occurrenceCountByRule.get(occurrence.ruleId) ?? 0) + 1,
      );
    }
    const attentionCountByRule = new Map<string, number>();
    for (const occurrence of this.recurringState.$needsAttention()) {
      attentionCountByRule.set(
        occurrence.ruleId,
        (attentionCountByRule.get(occurrence.ruleId) ?? 0) + 1,
      );
    }

    const rows = this.recurringState.$rules().map((rule) => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      prices: rule.prices
        .map((price) =>
          price.amount === undefined
            ? `${price.effectiveDate} · Variable`
            : `${price.effectiveDate} · $${price.amount.toFixed(2)}`,
        )
        .join('; '),
      cadence: CADENCE_LABELS[rule.cadence],
      targetParticipant: this.displayName(rule.targetParticipantId),
      paymentMode: rule.isAutopay ? 'Autopay' : 'Manual payment',
      beneficiaries: rule.beneficiaryParticipantIds.map((participantId) => ({
        id: participantId,
        name: this.displayName(participantId),
      })),
      activePeriod: rule.endDate
        ? `${rule.prices[0]!.effectiveDate} – ${rule.endDate}`
        : `From ${rule.prices[0]!.effectiveDate}`,
      occurrenceCount: occurrenceCountByRule.get(rule.id) ?? 0,
      attentionCount: attentionCountByRule.get(rule.id) ?? 0,
      isDone: rule.endDate !== undefined && rule.endDate < getLocalDate(),
      rule,
      canManage: rule.ownerUserId === this.appService.$currentUser()?.id,
    }));
    return orderRecurringRules(rows, this.$ruleOrder());
  });
  protected readonly $selectedRuleName = computed(
    () =>
      this.$ruleRows().find(
        (row) => row.id === this.$selectedOccurrenceRuleId(),
      )?.name,
  );
  protected readonly $visibleAttentionCount = computed(() => {
    const selectedRuleId = this.$selectedOccurrenceRuleId();
    return this.recurringState
      .$needsAttention()
      .filter(
        (occurrence) =>
          selectedRuleId === undefined || occurrence.ruleId === selectedRuleId,
      ).length;
  });
  protected readonly $nameCell =
    viewChild.required<TemplateRef<CellTemplateContext<RecurringRuleRow>>>(
      'nameCell',
    );
  protected readonly $typeCell =
    viewChild.required<TemplateRef<CellTemplateContext<RecurringRuleRow>>>(
      'typeCell',
    );
  protected readonly $beneficiariesCell =
    viewChild.required<TemplateRef<CellTemplateContext<RecurringRuleRow>>>(
      'beneficiariesCell',
    );
  protected readonly $targetParticipantCell = viewChild.required<
    TemplateRef<CellTemplateContext<RecurringRuleRow>>
  >('targetParticipantCell');
  protected readonly $pricesCell =
    viewChild.required<TemplateRef<CellTemplateContext<RecurringRuleRow>>>(
      'pricesCell',
    );
  protected readonly $ruleColumns = computed<
    readonly ColDef<RecurringRuleRow>[]
  >(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      pinned: TableColumnPin.Left,
      width: '16rem',
      headerClass: 'w-64',
      cellClass: 'min-w-56',
      cellTemplate: this.$nameCell(),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      headerClass: 'w-28',
      cellTemplate: this.$typeCell(),
    },
    {
      key: 'prices',
      label: 'Prices',
      headerClass: 'w-56',
      cellClass: 'min-w-48',
      cellTemplate: this.$pricesCell(),
    },
    { key: 'cadence', label: 'Frequency', sortable: true },
    {
      key: 'targetParticipant',
      label: 'Paid / received by',
      sortable: true,
      cellClass: 'whitespace-nowrap',
      cellTemplate: this.$targetParticipantCell(),
    },
    { key: 'paymentMode', label: 'Payment', sortable: true },
    {
      key: 'beneficiaries',
      label: 'Benefits',
      headerClass: 'w-64',
      cellClass: 'min-w-56',
      cellTemplate: this.$beneficiariesCell(),
    },
    {
      key: 'activePeriod',
      label: 'Active',
      sortable: true,
      headerClass: 'w-56',
      cellClass: 'min-w-48 whitespace-nowrap',
    },
  ]);

  protected addRule(): void {
    void this.router.navigate([ROUTE_KEYWORDS.NEW_ITEM], {
      relativeTo: this.activatedRoute,
    });
  }

  protected editRule(rule: RecurringRuleDto): void {
    void this.router.navigate([rule.id], { relativeTo: this.activatedRoute });
  }

  protected viewRuleOccurrences(ruleId: string): void {
    void this.router.navigate([
      '/',
      PageRoute.Recurring,
      ruleId,
      ROUTE_KEYWORDS.OCCURRENCES,
    ]);
  }

  protected viewRuleOccurrencesRow(
    action: TableRowAction<RecurringRuleRow>,
  ): void {
    this.viewRuleOccurrences(action.row.id);
  }

  protected updateRuleOrder(event: TableRowsReordered<RecurringRuleRow>): void {
    const order = event.rows.map((row) => row.id);
    this.$ruleOrder.set(order);
    try {
      localStorage.setItem(
        RECURRING_RULE_ORDER_STORAGE_KEY,
        JSON.stringify(order),
      );
    } catch {
      // The reordered view remains available for this session when storage is unavailable.
    }
  }

  protected clearOccurrenceRuleFilter(): void {
    void this.router.navigate(['/', PageRoute.Recurring]);
  }

  protected editRuleRow(action: TableRowAction<RecurringRuleRow>): void {
    this.editRule(action.row.rule);
  }

  protected endRuleRow(action: TableRowAction<RecurringRuleRow>): void {
    this.$actionError.set(undefined);
    this.$rulePendingDeletion.set(action.row.rule);
  }

  protected canManageRule(row: RecurringRuleRow): boolean {
    return row.canManage;
  }

  protected canViewRuleOccurrences(row: RecurringRuleRow): boolean {
    return row.occurrenceCount > 0;
  }

  protected cancelRuleDeletion(): void {
    if (this.$isDeletingRule()) return;
    this.$rulePendingDeletion.set(undefined);
  }

  protected async endRule(deleteHistory: boolean): Promise<void> {
    const rule = this.$rulePendingDeletion();
    if (!rule || this.$isDeletingRule()) return;
    this.$actionError.set(undefined);
    this.$isDeletingRule.set(true);
    try {
      await this.recurringState.endRule(rule.id, deleteHistory);
      this.$rulePendingDeletion.set(undefined);
    } catch (error: unknown) {
      this.$actionError.set(
        getHttpErrorMessage(error, 'Unable to end recurring rule.'),
      );
    } finally {
      this.$isDeletingRule.set(false);
    }
  }

  protected async markPaid(
    occurrence: RecurringOccurrenceDto,
    payment: MarkRecurringOccurrencePaidDto,
  ): Promise<void> {
    if (payment.payDate < occurrence.statementDate) {
      this.$actionError.set('Pay date must be on or after the statement date.');
      return;
    }
    if (payment.payDate > getLocalDate()) {
      this.$actionError.set('Pay date cannot be in the future.');
      return;
    }
    if (this.$submittingOccurrenceId()) return;
    this.$actionError.set(undefined);
    this.$submittingOccurrenceId.set(occurrence.id);
    try {
      await this.recurringState.markPaid(occurrence.id, {
        amount: payment.amount,
        payDate: payment.payDate,
      });
      this.$editingOccurrenceId.set(undefined);
    } catch (error: unknown) {
      this.$actionError.set(
        getHttpErrorMessage(error, 'Unable to save occurrence payment.'),
      );
    } finally {
      this.$submittingOccurrenceId.set(undefined);
    }
  }

  protected editOccurrence(occurrence: RecurringOccurrenceDto): void {
    this.$actionError.set(undefined);
    this.$editingOccurrenceId.set(occurrence.id);
  }

  protected cancelOccurrenceEdit(): void {
    this.$editingOccurrenceId.set(undefined);
  }

  protected displayName(participantId: string): string {
    return (
      this.appService
        .$participants()
        .find((participant) => participant.id === participantId)?.name ??
      participantId
    );
  }

  protected occurrenceState(occurrence: RecurringOccurrenceDto): string {
    if (occurrence.isPaid) return 'Paid';
    if (occurrence.isAutopay && occurrence.amount !== undefined)
      return 'Autopay scheduled';
    if (occurrence.amount === undefined) return 'Amount needed';
    return 'Payment needed';
  }
}
// #endregion

// #region Helpers
function readRuleOrder(): readonly string[] {
  try {
    const storedOrder = window.localStorage.getItem(
      RECURRING_RULE_ORDER_STORAGE_KEY,
    );
    const parsedOrder: unknown = storedOrder ? JSON.parse(storedOrder) : [];
    return Array.isArray(parsedOrder) && parsedOrder.every(isString)
      ? parsedOrder
      : [];
  } catch {
    return [];
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function orderRecurringRules<TRow extends TableBaseData>(
  rows: readonly TRow[],
  savedOrder: readonly string[],
): readonly TRow[] {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const orderedRows = savedOrder.flatMap((id) => {
    const row = rowById.get(id);
    return row ? [row] : [];
  });
  const savedIds = new Set(savedOrder);
  return [...orderedRows, ...rows.filter((row) => !savedIds.has(row.id))];
}

function getLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function toOccurrenceView(
  occurrence: RecurringOccurrenceDto,
): RecurringOccurrenceView {
  return {
    occurrence,
    isAmountEditable: occurrence.isAmountVariable,
    isPayDateEditable: !occurrence.isAutopay,
    isFullyAutomated: occurrence.isAutopay && !occurrence.isAmountVariable,
  };
}
// #endregion
