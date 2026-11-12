// #region Imports
import {
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { of } from 'rxjs';

import type {
  ExpenseDto,
  UserDto,
} from '../api/generated/expense-exchange-api.schemas';
// #endregion

// #region Mock Data
export const MOCK_User: UserDto = { id: 'user-1', name: 'Alex Morgan' };
export const MOCK_User_Array: UserDto[] = [
  MOCK_User,
  { id: 'user-2', name: 'Taylor Jordan' },
];

export const MOCK_Expense: ExpenseDto = {
  id: 'expense-1',
  name: 'Groceries',
  description: 'Weekly groceries',
  amount: 64.25,
  datePaid: '2026-01-10',
  forDate: '2026-01-10',
  paidByUserId: MOCK_User.id,
  paidForUserIds: MOCK_User_Array.map((user) => user.id),
};
export const MOCK_Expense_Array: ExpenseDto[] = [MOCK_Expense];

export const MOCK_ExpenseApiInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const path = new URL(request.url, window.location.origin).pathname;
  if (path === '/api/users') {
    if (request.method === 'GET') {
      return of(new HttpResponse({ body: MOCK_User_Array }));
    }
    if (request.method === 'POST') {
      const body = request.body as Partial<UserDto>;
      return of(
        new HttpResponse({
          status: 201,
          body: { id: `user-${Date.now()}`, name: body.name ?? 'New user' },
        }),
      );
    }
  }
  if (path.startsWith('/api/users/')) {
    const id = path.slice('/api/users/'.length);
    if (request.method === 'PUT') {
      const body = request.body as Partial<UserDto>;
      return of(new HttpResponse({ body: { id, name: body.name ?? 'User' } }));
    }
    if (request.method === 'DELETE') {
      const user = MOCK_User_Array.find((candidate) => candidate.id === id);
      return of(new HttpResponse({ body: user ?? { id, name: 'User' } }));
    }
  }
  if (path === '/api/expenses') {
    return of(new HttpResponse({ body: MOCK_Expense_Array }));
  }
  if (path.startsWith('/api/expenses/')) {
    return of(new HttpResponse({ body: MOCK_Expense }));
  }
  return next(request);
};

export const MOCK_ExpenseApiProvider = provideHttpClient(
  withInterceptors([MOCK_ExpenseApiInterceptor]),
);
// #endregion
