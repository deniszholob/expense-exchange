import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Expense, ExpenseService, User } from 'src/app/api';
import { ROUTE_KEYWORDS } from 'src/app/app.info';
import { ExpenseDetailsComponent } from 'src/app/components/expense-details/expense-details.component';
import { ExpenseTableComponent } from 'src/app/components/expense-table/expense-table.component';
import {
  DetailsPageDirective,
  DetailsPageState,
  PageLayoutComponent,
  validateIdStringAny,
} from 'src/app/layout';
import { AppService } from 'src/app/shared/app/app.service';
import { DetailedExpense } from 'src/app/shared/detailed-expense/detailed-expense.model';

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
  protected expenses$: Observable<DetailedExpense[]> =
    this.appService.detailedExpenses$;

  protected expense?: Expense;
  protected users$: Observable<User[]> = this.appService.users$;
  protected users = this.appService._users;

  constructor(
    protected appService: AppService,
    private expenseService: ExpenseService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    super();
    const routeId = this.getRouteDetailId(
      activatedRoute,
      router,
      validateIdStringAny,
    );

    routeId
      .pipe(
        switchMap((id) =>
          id === ROUTE_KEYWORDS.NEW_ITEM
            ? of(undefined)
            : this.expenseService.getExpense(id ?? ''),
        ),
        tap((expense) => {
          this.expense = expense;
          this.pageState = DetailsPageState.LOADED_PARAM_DATA;
        }),
        catchError((err) => {
          console.error(err);
          this.pageState = DetailsPageState.ERROR;
          this.errors.push(err.message);
          return of(undefined);
        }),
      )
      .subscribe();
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

  protected onSaveExpense(expense: Expense): void {
    expense.id?.length
      ? this.saveExistingExpense(expense)
      : this.saveNewExpense(expense);
  }

  private deleteExpense(expenseId: string): void {
    this.expenseService.deleteExpense(expenseId).subscribe({
      next: (): void => {
        this.appService.refreshExpenses$.next();
      },
      error: (err: unknown): void => {
        console.error(err);
      },
    });
  }

  private saveNewExpense(expense: Expense): void {
    this.expenseService.addExpense(expense).subscribe({
      next: (): void => {
        this.appService.refreshExpenses$.next();
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      },
      error: (err: unknown): void => {
        console.error(err);
      },
    });
  }

  private saveExistingExpense(expense: Expense): void {
    this.expenseService.updateExpense(expense).subscribe({
      next: (): void => {
        this.appService.refreshExpenses$.next();
        this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      },
      error: (err: unknown): void => {
        console.error(err);
      },
    });
  }
}
