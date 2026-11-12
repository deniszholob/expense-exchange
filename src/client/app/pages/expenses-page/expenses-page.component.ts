// #region Imports
import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  CreateExpenseDto,
  ExpenseDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { expenseControllerGetExpenseResource } from 'src/client/api/generated/expenses/expenses.resource';
import { ExpensesService } from 'src/client/api/generated/expenses/expenses.service';
import { ROUTE_KEYWORDS } from 'src/client/app/app.info';
import { ExpenseDetailsComponent } from 'src/client/app/components/expense-details/expense-details.component';
import { ExpenseTableComponent } from 'src/client/app/components/expense-table/expense-table.component';
import {
  DetailsPageDirective,
  DetailsPageState,
  PageLayoutComponent,
} from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
// #endregion

// #region Implementation

@Component({
  selector: 'app-expenses-page',
  templateUrl: './expenses-page.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [
    CommonModule,
    ExpenseTableComponent,
    ExpenseDetailsComponent,
    PageLayoutComponent,
  ],
  providers: [DatePipe],
})
export class ExpensesPageComponent extends DetailsPageDirective {
  protected readonly $expenses = this.appService.$detailedExpenses;
  private readonly $routeId = toSignal(
    this.activatedRoute.params.pipe(
      map((params) =>
        typeof params['id'] === 'string' ? params['id'] : undefined,
      ),
    ),
    { initialValue: undefined },
  );
  private readonly $resourceId = computed(() => {
    const id = this.$routeId();
    return id && id !== ROUTE_KEYWORDS.NEW_ITEM ? id : undefined;
  });
  private readonly expenseResource = expenseControllerGetExpenseResource(
    this.$resourceId,
  );
  protected readonly $expense = this.expenseResource.value;
  protected readonly $pageState = computed(() => {
    const id = this.$routeId();
    if (!id) return DetailsPageState.NO_PARAMS;
    if (id === ROUTE_KEYWORDS.NEW_ITEM)
      return DetailsPageState.LOADED_PARAM_DATA;
    if (this.expenseResource.error()) return DetailsPageState.ERROR;
    if (this.expenseResource.isLoading() || !this.expenseResource.hasValue()) {
      return DetailsPageState.LOADING;
    }
    return DetailsPageState.LOADED_PARAM_DATA;
  });
  protected readonly $errors = computed(() => {
    const error = this.expenseResource.error();
    return error ? [error.message] : [];
  });

  public constructor(
    protected appService: AppService,
    private readonly expenseApi: ExpensesService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
  ) {
    super();
  }

  protected onAddExpense(): void {
    this.router.navigate([ROUTE_KEYWORDS.NEW_ITEM], {
      relativeTo: this.activatedRoute,
    });
  }

  protected onEditExpense(expenseId: string): void {
    this.router.navigate([expenseId], { relativeTo: this.activatedRoute });
  }

  protected onDeleteExpense(expenseId: string): void {
    this.deleteExpense(expenseId);
  }

  protected onSaveExpense(expense: ExpenseDto): void {
    if (expense.id?.length) {
      this.saveExistingExpense(expense);
    } else {
      this.saveNewExpense(expense);
    }
  }

  private deleteExpense(expenseId: string): void {
    this.expenseApi
      .expenseControllerDeleteExpense<ExpenseDto>(expenseId)
      .subscribe({
        next: (): void => {
          this.appService.refreshExpenses();
        },
        error: (err: unknown): void => {
          console.error(err);
        },
      });
  }

  private saveNewExpense(expense: ExpenseDto): void {
    this.expenseApi
      .expenseControllerCreateExpense<ExpenseDto>(toCreateExpense(expense))
      .subscribe({
        next: (): void => {
          this.appService.refreshExpenses();
          this.router.navigate(['..'], { relativeTo: this.activatedRoute });
        },
        error: (err: unknown): void => {
          console.error(err);
        },
      });
  }

  private saveExistingExpense(expense: ExpenseDto): void {
    this.expenseApi
      .expenseControllerUpdateExpense<ExpenseDto>(
        expense.id,
        toCreateExpense(expense),
      )
      .subscribe({
        next: (): void => {
          this.appService.refreshExpenses();
          this.router.navigate(['..'], { relativeTo: this.activatedRoute });
        },
        error: (err: unknown): void => {
          console.error(err);
        },
      });
  }
}

function toCreateExpense(expense: ExpenseDto): CreateExpenseDto {
  return {
    name: expense.name,
    description: expense.description,
    amount: expense.amount,
    datePaid: expense.datePaid,
    forDate: expense.forDate,
    paidByUserId: expense.paidByUserId,
    paidForUserIds: expense.paidForUserIds,
  };
}

// #endregion
