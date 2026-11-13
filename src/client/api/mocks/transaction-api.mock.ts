// #region Imports
import {
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import type { HttpInterceptorFn } from '@angular/common/http';
import { of } from 'rxjs';

import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  GroupMemberDto,
  TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region Mock Data
export const MOCK_GroupMember: GroupMemberDto = {
  id: 'member-1',
  name: 'Alex Morgan',
};
export const MOCK_GroupMember_Array: GroupMemberDto[] = [
  MOCK_GroupMember,
  { id: 'member-2', name: 'Taylor Jordan' },
];

export const MOCK_Transaction: TransactionDto = {
  id: 'expense-1',
  type: TransactionType.Expense,
  name: 'Groceries',
  amount: 64.25,
  postDate: '2026-01-10',
  completeDate: '2026-01-10',
  targetUserId: MOCK_GroupMember.id,
  beneficiaryUserIds: MOCK_GroupMember_Array.map((member) => member.id),
  note: 'Weekly groceries',
};
export const MOCK_Transaction_Array: TransactionDto[] = [MOCK_Transaction];

export const MOCK_TransactionApiInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const path = new URL(request.url, window.location.origin).pathname;
  if (path === '/api/groups/members') {
    if (request.method === 'GET') {
      return of(new HttpResponse({ body: MOCK_GroupMember_Array }));
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
      const user = MOCK_GroupMember_Array.find(
        (candidate) => candidate.id === id,
      );
      return of(new HttpResponse({ body: user ?? { id, name: 'User' } }));
    }
  }
  if (path === '/api/transactions') {
    return of(new HttpResponse({ body: MOCK_Transaction_Array }));
  }
  if (path.startsWith('/api/transactions/')) {
    return of(new HttpResponse({ body: MOCK_Transaction }));
  }
  return next(request);
};

export const MOCK_TransactionApiProvider = provideHttpClient(
  withInterceptors([MOCK_TransactionApiInterceptor]),
);
// #endregion
