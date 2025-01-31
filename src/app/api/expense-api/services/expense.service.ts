import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiConfiguration } from '../api-configuration';
import { BaseService } from '../base.service';
import { Expense, User } from '../models';

@Injectable({ providedIn: 'root' })
export class ExpenseService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  // #region Users
  public static readonly GetUsersPath = '/users';
  public getUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>(
      `${this.rootUrl}${ExpenseService.GetUsersPath}`,
    );
  }
  // #endregion

  // #region Expenses
  public static readonly GetExpensesPath = '/expenses';

  public getExpenses(
    params?: undefined,
    context?: HttpContext,
  ): Observable<Expense[]> {
    return this.httpClient.get<Expense[]>(
      `${this.rootUrl}${ExpenseService.GetExpensesPath}`,
      { context, params },
    );
  }

  public getExpense(id: string): Observable<Expense> {
    return this.httpClient.get<Expense>(
      `${this.rootUrl}${ExpenseService.GetExpensesPath}/${id}`,
    );
  }

  public addExpense(body: Expense): Observable<{ id: string }> {
    return this.httpClient.post<{ id: string }>(
      `${this.rootUrl}${ExpenseService.GetExpensesPath}`,
      body,
    );
  }

  public deleteExpense(id: string): Observable<Expense> {
    return this.httpClient.delete<Expense>(
      `${this.rootUrl}${ExpenseService.GetExpensesPath}/${id}`,
    );
    // .pipe(switchMap(() => this.getExpenses()));
  }

  public updateExpense(body: Expense): Observable<Expense[]> {
    return this.httpClient.put<Expense[]>(
      `${this.rootUrl}${ExpenseService.GetExpensesPath}/${body.id}`,
      body,
    );
  }
  // #endregion
}
