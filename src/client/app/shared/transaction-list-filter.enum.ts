// #region Imports
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import { TRANSACTION_TYPE_INFO } from 'src/client/app/shared/transaction-type.info';
// #endregion

// #region Enum
export enum TransactionListFilter {
  Expense = 'Expense',
  Income = 'Income',
  All = 'All',
}

export const TRANSACTION_LIST_FILTER_OPTIONS: TransactionListFilter[] =
  Object.values(TransactionListFilter);

export function isTransactionListFilter(
  value: string,
): value is TransactionListFilter {
  return TRANSACTION_LIST_FILTER_OPTIONS.includes(
    value as TransactionListFilter,
  );
}
// #endregion

// #region Enum Information
export interface TransactionListFilterInfo {
  readonly id: TransactionListFilter;
  readonly display: string;
}

export const TRANSACTION_LIST_FILTER_INFO: Record<
  TransactionListFilter,
  TransactionListFilterInfo
> = {
  [TransactionListFilter.Expense]: {
    id: TransactionListFilter.Expense,
    display: TRANSACTION_TYPE_INFO[TransactionType.Expense].display,
  },
  [TransactionListFilter.Income]: {
    id: TransactionListFilter.Income,
    display: TRANSACTION_TYPE_INFO[TransactionType.Income].display,
  },
  [TransactionListFilter.All]: {
    id: TransactionListFilter.All,
    display: 'All',
  },
} as const;

export const TRANSACTION_LIST_FILTER_INFO_OPTIONS: TransactionListFilterInfo[] =
  TRANSACTION_LIST_FILTER_OPTIONS.map(
    (filter: TransactionListFilter): TransactionListFilterInfo =>
      TRANSACTION_LIST_FILTER_INFO[filter],
  );
// #endregion
