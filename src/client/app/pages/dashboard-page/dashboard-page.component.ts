// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SegmentedControlComponent } from 'src/client/app/components/forms/segmented-control/segmented-control.component';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import {
  RecurringTransactionType,
  TransactionType,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { DataRangeService } from 'src/client/app/shared/data-range.service';
import { RecurringStateService } from 'src/client/app/shared/recurring-state.service';
import {
  TransactionScope,
  TRANSACTION_SCOPE_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-scope.enum';
import {
  formatDataRangeLabel,
  isDateWithinRange,
} from '../../shared/date-range/date-range.util';
import { createDashboardRangeSummary } from './dashboard-range-summary.model';
// #endregion

// #region Models
interface DashboardActivity {
  readonly id: string;
  readonly isRecurring: boolean;
  readonly type: TransactionType | RecurringTransactionType;
  readonly name: string;
  readonly amount: number;
  readonly targetParticipantId: string;
  readonly beneficiaryParticipantIds: readonly string[];
  readonly activityDate: string;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  host: { class: 'contents' },
  imports: [CommonModule, PageLayoutComponent, SegmentedControlComponent],
})
export class DashboardPageComponent {
  private readonly appService = inject(AppService);
  private readonly dataRangeService = inject(DataRangeService);
  private readonly recurringState = inject(RecurringStateService);
  protected readonly $participants = this.appService.$participants;
  protected readonly $groupMembers = this.appService.$groupMembers;
  protected readonly $currentUser = this.appService.$currentUser;
  protected readonly $spendingScope = signal(TransactionScope.MyShare);
  protected readonly $scopeOptions = computed(() =>
    TRANSACTION_SCOPE_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
      ...(id === TransactionScope.MyShare && {
        disabled: !this.$personalSpendingAvailable(),
      }),
    })),
  );
  protected readonly $rangeLabel = computed(() =>
    formatDataRangeLabel(this.dataRangeService.$dataRange()),
  );
  protected readonly $rangeSummary = computed(() =>
    createDashboardRangeSummary(
      this.appService.$transactions(),
      this.recurringState.$occurrences(),
      this.$participants(),
      this.dataRangeService.$dataRange(),
      this.$currentUser()?.id,
    ),
  );
  protected readonly $personalSpendingAvailable = computed(() => {
    const userId = this.$currentUser()?.id;
    return (
      userId !== undefined &&
      this.$groupMembers().some((user) => user.id === userId)
    );
  });
  protected readonly $cashFlowActivities = computed(() => {
    const participants = new Map(
      this.$participants().map((participant) => [
        participant.id,
        participant.name,
      ]),
    );
    const transactions: DashboardActivity[] = this.appService
      .$transactions()
      .map((transaction) => ({
        id: `transaction:${transaction.id}`,
        isRecurring: false,
        type: transaction.type,
        name: transaction.name,
        amount: transaction.amount,
        targetParticipantId: transaction.targetParticipantId,
        beneficiaryParticipantIds: transaction.beneficiaryParticipantIds,
        activityDate: transaction.completeDate,
      }));
    const recurringPayments: DashboardActivity[] = this.recurringState
      .$occurrences()
      .filter(
        (occurrence) => occurrence.isPaid && occurrence.amount !== undefined,
      )
      .map((occurrence) => ({
        id: `occurrence:${occurrence.id}`,
        isRecurring: true,
        type: occurrence.type,
        name: occurrence.name,
        amount: occurrence.amount ?? 0,
        targetParticipantId: occurrence.targetParticipantId,
        beneficiaryParticipantIds: occurrence.beneficiaryParticipantIds,
        activityDate: occurrence.payDate,
      }));
    return [...transactions, ...recurringPayments]
      .sort((first, second) =>
        second.activityDate.localeCompare(first.activityDate),
      )
      .map((activity) => ({
        ...activity,
        targetName:
          participants.get(activity.targetParticipantId) ??
          activity.targetParticipantId,
      }));
  });
  protected readonly $rangeCashFlowActivities = computed(() => {
    const range = this.dataRangeService.$dataRange();
    const personId = this.$currentUser()?.id;
    return this.$cashFlowActivities().filter(
      (activity) =>
        isDateWithinRange(activity.activityDate, range) &&
        (this.$spendingScope() === TransactionScope.Group ||
          (personId !== undefined &&
            activity.beneficiaryParticipantIds.includes(personId))),
    );
  });
  protected readonly TransactionType = TransactionType;
  protected readonly TransactionScope = TransactionScope;
  protected readonly $trackedSpending = computed(() =>
    this.$spendingScope() === TransactionScope.MyShare
      ? this.$rangeSummary().personalSpending
      : this.$rangeSummary().totalSpending,
  );
  protected readonly $trackedIncome = computed(() =>
    this.$spendingScope() === TransactionScope.MyShare
      ? this.$rangeSummary().personalIncome
      : this.$rangeSummary().totalIncome,
  );
  protected readonly $trackedRefunds = computed(() =>
    this.$spendingScope() === TransactionScope.MyShare
      ? this.$rangeSummary().personalRefunds
      : this.$rangeSummary().totalRefunds,
  );
  protected readonly $trackedNetCashFlow = computed(
    () =>
      this.$trackedIncome() + this.$trackedRefunds() - this.$trackedSpending(),
  );
  protected readonly $incomeBarWidth = computed(() => {
    const total =
      this.$trackedIncome() + this.$trackedSpending() + this.$trackedRefunds();
    return total === 0 ? 0 : (this.$trackedIncome() / total) * 100;
  });
  protected readonly $expenseBarWidth = computed(() => {
    const total =
      this.$trackedIncome() + this.$trackedSpending() + this.$trackedRefunds();
    return total === 0 ? 0 : (this.$trackedSpending() / total) * 100;
  });
  protected readonly $refundBarWidth = computed(() => {
    const total =
      this.$trackedIncome() + this.$trackedSpending() + this.$trackedRefunds();
    return total === 0 ? 0 : (this.$trackedRefunds() / total) * 100;
  });
  protected readonly $spendingDescription = computed(() =>
    this.$spendingScope() === TransactionScope.MyShare
      ? 'Your share of expenses, income, and refunds in the selected range'
      : 'Group expenses, income, and refunds in the selected range',
  );
}
// #endregion
