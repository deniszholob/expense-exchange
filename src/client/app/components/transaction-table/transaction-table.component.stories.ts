// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  TransactionRow,
  TransactionTableComponent,
} from './transaction-table.component';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

const MOCK_TransactionRow_Array: TransactionRow[] = [
  {
    id: 'sample-expense',
    kind: TransactionType.Expense,
    amount: 42.5,
    name: 'Groceries',
    description: 'Weekly groceries',
    party: 'Alice',
    beneficiaries: 'Alice, Bob',
    date: '2026-11-12',
    recordedDate: '2026-11-12',
    rangeDate: '2026-11-12',
    memberUserIds: ['alice', 'bob'],
    canManage: true,
  },
  {
    id: 'sample-income',
    kind: TransactionType.Income,
    amount: 1250,
    name: 'Paycheck',
    description: '',
    party: 'Alice',
    beneficiaries: '',
    date: '2026-11-10',
    recordedDate: '2026-11-10',
    rangeDate: '2026-11-10',
    memberUserIds: ['alice'],
    canManage: true,
  },
  {
    id: 'sample-refund',
    kind: TransactionType.Refund,
    amount: 12.99,
    name: 'Returned item',
    description: 'Refund from a returned purchase',
    party: 'Bob',
    beneficiaries: 'Alice',
    date: '2026-11-08',
    recordedDate: '2026-11-08',
    rangeDate: '2026-11-08',
    memberUserIds: ['bob', 'alice'],
    canManage: false,
  },
];
// #region Stories
const meta: Meta<TransactionTableComponent> = {
  component: TransactionTableComponent,
  decorators: [moduleMetadata({ imports: [TransactionTableComponent] })],
  args: {
    $rows: [...MOCK_TransactionRow_Array],
  },
};
export default meta;

export const TransactionTable: StoryObj<TransactionTableComponent> = {};
// #endregion
