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
import { LucidePlus, LucideReceipt } from '@lucide/angular';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { DateRangeSelectorComponent } from '../../components/date-range-selector/date-range-selector.component';
import { DateRangePreset } from '../../shared/date-range/date-range-preset.enum';
import {
  createDateRangeForPreset,
  formatDateRangeLabel,
  getEarliestDate,
} from '../../shared/date-range/date-range.util';
import { createDashboardRangeSummary } from './dashboard-range-summary.model';
// #endregion

// #region Enums
enum DashboardSpendingScope {
  Group = 'Group',
  Personal = 'Personal',
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [
    CommonModule,
    PageLayoutComponent,
    RouterModule,
    DateRangeSelectorComponent,
    LucidePlus,
    LucideReceipt,
  ],
})
export class DashboardPageComponent {
  private readonly appService = inject(AppService);
  protected readonly $groupMembers = this.appService.$groupMembers;
  protected readonly $currentUser = this.appService.$currentUser;
  protected readonly DashboardSpendingScope = DashboardSpendingScope;
  protected readonly $spendingScope = signal(DashboardSpendingScope.Group);
  protected readonly $dateRange = signal(
    createDateRangeForPreset(DateRangePreset.Month),
  );
  protected readonly $earliestExpenseDate = computed(() =>
    getEarliestDate(
      this.appService.$expenses().map((expense) => expense.datePaid),
    ),
  );
  protected readonly $rangeLabel = computed(() =>
    formatDateRangeLabel(this.$dateRange()),
  );
  protected readonly $rangeSummary = computed(() =>
    createDashboardRangeSummary(
      this.appService.$detailedExpenses(),
      this.$dateRange(),
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
  protected readonly $recentExpenses = computed(() =>
    [...this.appService.$detailedExpenses()]
      .sort((first, second) => second.datePaid.localeCompare(first.datePaid))
      .slice(0, 5),
  );
  protected readonly $expenseCount = computed(
    () => this.$rangeSummary().expenseCount,
  );
  protected readonly $trackedSpending = computed(() =>
    this.$spendingScope() === DashboardSpendingScope.Personal
      ? this.$rangeSummary().personalSpending
      : this.$rangeSummary().totalSpending,
  );
  protected readonly $trackedIncome = computed(() => 0);
  protected readonly $incomeBarWidth = computed(() => {
    const total = this.$trackedIncome() + this.$trackedSpending();
    return total === 0 ? 0 : (this.$trackedIncome() / total) * 100;
  });
  protected readonly $expenseBarWidth = computed(() => {
    const total = this.$trackedIncome() + this.$trackedSpending();
    return total === 0 ? 0 : (this.$trackedSpending() / total) * 100;
  });
  protected readonly $spendingDescription = computed(() =>
    this.$spendingScope() === DashboardSpendingScope.Personal
      ? 'Your allocated expense shares in the selected range'
      : 'Total group expenses paid in the selected range',
  );

  protected selectSpendingScope(scope: DashboardSpendingScope): void {
    if (
      scope === DashboardSpendingScope.Personal &&
      !this.$personalSpendingAvailable()
    )
      return;
    this.$spendingScope.set(scope);
  }
}
// #endregion
