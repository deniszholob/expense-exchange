import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  Expense,
  MOCK_Expense,
  MOCK_Expense_Array,
  MOCK_User_Array,
  User,
} from '../models';
import { ExpenseService } from './expense.service';

export const MOCK_ExpenseService: Partial<ExpenseService> = {
  getExpenses(): Observable<Expense[]> {
    return of(MOCK_Expense_Array);
  },
  getUsers(): Observable<User[]> {
    return of(MOCK_User_Array);
  },
  deleteExpense(): Observable<Expense> {
    return of(MOCK_Expense);
  },
  getExpense(id: string): Observable<Expense> {
    if (id === 'invalid-id') throw new Error('invalid-id');
    return of(MOCK_Expense);
  },
  addExpense(): Observable<{ id: string }> {
    return of({ id: 'id' });
  },
  updateExpense(): Observable<Expense[]> {
    return of(MOCK_Expense_Array);
  },
};

export const MOCK_ExpenseServiceProvider: Provider = {
  provide: ExpenseService,
  useValue: MOCK_ExpenseService,
};
