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
  GroupMemberDto,
} from '../api/generated/expense-exchange-api.schemas';
// #endregion

// #region Mock Data
export const MOCK_GroupMember: GroupMemberDto = {
  id: 'member-1',
  name: 'Alex Morgan',
};
export const MOCK_GroupMembers: GroupMemberDto[] = [
  MOCK_GroupMember,
  { id: 'member-2', name: 'Taylor Jordan' },
];

export const MOCK_Expense: ExpenseDto = {
  id: 'expense-1',
  name: 'Groceries',
  description: 'Weekly groceries',
  amount: 64.25,
  datePaid: '2026-01-10',
  forDate: '2026-01-10',
  paidByUserId: MOCK_GroupMember.id,
  paidForUserIds: MOCK_GroupMembers.map((member) => member.id),
};
export const MOCK_Expense_Array: ExpenseDto[] = [MOCK_Expense];

export const MOCK_ExpenseApiInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const path = new URL(request.url, window.location.origin).pathname;
  if (path === '/api/groups/members') {
    if (request.method === 'GET') {
      return of(new HttpResponse({ body: MOCK_GroupMembers }));
    }
    if (request.method === 'POST') {
      const body = request.body as Partial<GroupMemberDto>;
      return of(
        new HttpResponse({
          status: 201,
          body: { id: `member-${Date.now()}`, name: body.name ?? 'New member' },
        }),
      );
    }
  }
  if (path.startsWith('/api/groups/members/')) {
    const id = path.slice('/api/groups/members/'.length);
    if (request.method === 'PUT') {
      const body = request.body as Partial<GroupMemberDto>;
      return of(new HttpResponse({ body: { id, name: body.name ?? 'User' } }));
    }
    if (request.method === 'DELETE') {
      const user = MOCK_GroupMembers.find((candidate) => candidate.id === id);
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
