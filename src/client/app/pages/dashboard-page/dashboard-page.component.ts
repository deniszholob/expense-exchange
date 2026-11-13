// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideReceipt } from '@lucide/angular';
import { SegmentedControlComponent } from 'src/client/app/components/forms/segmented-control/segmented-control.component';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import { DataRangeService } from 'src/client/app/shared/data-range.service';
import {
  TransactionScope,
  TRANSACTION_SCOPE_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-scope.enum';
import { formatDataRangeLabel } from '../../shared/date-range/date-range.util';
import { createDashboardRangeSummary } from './dashboard-range-summary.model';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    PageLayoutComponent,
    RouterModule,
    SegmentedControlComponent,
    LucideReceipt,
  ],
})
export class DashboardPageComponent {
  private readonly appService = inject(AppService);
  private readonly dataRangeService = inject(DataRangeService);
  protected readonly $groupMembers = this.appService.$groupMembers;
  protected readonly $currentUser = this.appService.$currentUser;
  protected readonly $spendingScope = signal(TransactionScope.Group);
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
      this.$groupMembers(),
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
  protected readonly $recentTransactions = computed(() => {
    const members = new Map(
      this.$groupMembers().map((member) => [member.id, member.name]),
    );
    return [...this.appService.$transactions()]
      .sort((first, second) =>
        second.completeDate.localeCompare(first.completeDate),
      )
      .slice(0, 5)
      .map((transaction) => ({
        ...transaction,
        targetName:
          members.get(transaction.targetUserId) ?? transaction.targetUserId,
      }));
  });
  protected readonly TransactionType = TransactionType;
  protected readonly $expenseCount = computed(
    () => this.$rangeSummary().expenseCount,
  );
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
