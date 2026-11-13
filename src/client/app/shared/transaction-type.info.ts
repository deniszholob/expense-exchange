// #region Imports
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region Enum Information
export interface TransactionTypeInfo {
  readonly id: TransactionType;
  readonly display: string;
}

export const TRANSACTION_TYPE_OPTIONS: TransactionType[] =
  Object.values(TransactionType);

export const TRANSACTION_TYPE_INFO: Record<
  TransactionType,
  TransactionTypeInfo
> = {
  [TransactionType.Expense]: {
    id: TransactionType.Expense,
    display: 'Expense',
  },
  [TransactionType.Income]: {
    id: TransactionType.Income,
    display: 'Income',
  },
  [TransactionType.Refund]: {
    id: TransactionType.Refund,
    display: 'Refund',
  },
} as const;

export const TRANSACTION_TYPE_INFO_OPTIONS: TransactionTypeInfo[] =
  TRANSACTION_TYPE_OPTIONS.map(
    (type: TransactionType): TransactionTypeInfo => TRANSACTION_TYPE_INFO[type],
  );
// #endregion
