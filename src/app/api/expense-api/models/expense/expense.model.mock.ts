import { DatePipe } from '@angular/common';
import { faker } from '@faker-js/faker';

import { MOCK_User, MOCK_User_Array } from '../user/user.model.mock';
import { Expense } from './expense.model';

// ===== Simple Mock ====== //
// export const MOCK_Expense: Expense = {
//   id: 'string',
// };

// export const MOCK_Expense_Array: Expense[] = [MOCK_Expense];

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
const MOCK_DATE: Date = faker.date.past();
const datePipe = new DatePipe('en-US');

function formatDate(date: Date): string {
  return datePipe.transform(date, 'yyyy-MM-dd') ?? '';
}

export function createMock_Expense(): Expense {
  return {
    id: faker.string.ulid(),
    name: faker.commerce.product(),
    description: faker.finance.transactionType(),
    amount: faker.number.float({ fractionDigits: 2, min: 1, max: 1000 }),
    datePaid: formatDate(MOCK_DATE),
    forDate: formatDate(MOCK_DATE),
    paidByUserId: MOCK_User_Array[0]?.id ?? MOCK_User.id,
    paidForUserIds: MOCK_User_Array.map((user) => user.id),
  };
}

export function createMock_Expense_Array(count: number): Expense[] {
  return faker.helpers.multiple(createMock_Expense, { count });
}

export const MOCK_Expense: Expense = createMock_Expense();
export const MOCK_Expense_Array: Expense[] = createMock_Expense_Array(6);

console.log(`MOCK_Expense_Array`, MOCK_Expense_Array);
