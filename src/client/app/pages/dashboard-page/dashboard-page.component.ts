import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucidePlus, LucideReceipt } from '@lucide/angular';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [
    CommonModule,
    PageLayoutComponent,
    RouterModule,
    LucidePlus,
    LucideReceipt,
  ],
  providers: [],
})
export class DashboardPageComponent {
  private readonly appService = inject(AppService);
  protected readonly $groupMembers = this.appService.$groupMembers;
  protected readonly $recentExpenses = computed(() =>
    [...this.appService.$detailedExpenses()]
      .sort((first, second) => second.datePaid.localeCompare(first.datePaid))
      .slice(0, 5),
  );
  protected readonly $expenseCount = computed(
    () => this.appService.$expenses().length,
  );
  protected readonly $trackedSpending = computed(() =>
    this.appService
      .$expenses()
      .reduce((total, expense) => total - expense.amount, 0),
  );
}
