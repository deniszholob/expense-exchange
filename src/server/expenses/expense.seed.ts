// #region Imports
import type { ExpenseStore } from './expense.repository.js';
// #endregion

// #region Seed Data
/** Synthetic starter data used only when the persistent store is first created. */
export const INITIAL_EXPENSE_STORE: ExpenseStore = {
  version: 1,
  users: [
    { id: 'demo-user-john', name: 'John Doe' },
    { id: 'demo-user-jane', name: 'Jane Smith' },
  ],
  expenses: [
    {
      id: 'demo-expense-sausages',
      name: 'Sausages',
      description: 'invoice',
      amount: 734.11,
      datePaid: '2024-07-04',
      forDate: '2024-07-04',
      paidByUserId: 'demo-user-john',
      paidForUserIds: ['demo-user-john', 'demo-user-jane'],
    },
    {
      id: 'demo-expense-table',
      name: 'Table',
      description: 'deposit',
      amount: 794.75,
      datePaid: '2024-07-04',
      forDate: '2024-07-04',
      paidByUserId: 'demo-user-john',
      paidForUserIds: ['demo-user-john'],
    },
    {
      id: 'demo-expense-computer',
      name: 'Computer',
      description: 'withdrawal',
      amount: 598.07,
      datePaid: '2024-07-04',
      forDate: '2024-07-04',
      paidByUserId: 'demo-user-john',
      paidForUserIds: ['demo-user-jane'],
    },
    {
      id: 'demo-expense-shoes',
      name: 'Shoes',
      description: 'deposit',
      amount: 431.79,
      datePaid: '2024-07-04',
      forDate: '2024-07-04',
      paidByUserId: 'demo-user-jane',
      paidForUserIds: ['demo-user-john', 'demo-user-jane'],
    },
  ],
};
// #endregion
