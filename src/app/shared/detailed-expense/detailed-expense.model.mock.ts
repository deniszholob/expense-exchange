// import { faker } from '@faker-js/faker';

import { MOCK_Expense, MOCK_User, MOCK_User_Array } from 'src/app/api';

import { DetailedExpense } from './detailed-expense.model';

// ===== Simple Mock ====== //
export const MOCK_DetailedExpense: DetailedExpense = {
  ...MOCK_Expense,
  paidByUser: MOCK_User,
  paidForUsers: MOCK_User_Array,
};

export const MOCK_DetailedExpense_Array: DetailedExpense[] = [
  MOCK_DetailedExpense,
];

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
// export function createMock_DetailedExpense(): DetailedExpense {
//   return {
//     id: faker.string.uuid(),
//   };
// }

// export function createMock_DetailedExpense_Array(count: number): DetailedExpense[] {
//   return faker.helpers.multiple(createMock_DetailedExpense, { count });
// }

// export const MOCK_DetailedExpense: DetailedExpense = createMock_DetailedExpense();
// export const MOCK_DetailedExpense_Array: DetailedExpense[] = createMock_DetailedExpense_Array(5);
