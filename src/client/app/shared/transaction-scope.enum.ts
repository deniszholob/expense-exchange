// #region Enum
export enum TransactionScope {
  Group = 'Group',
  MyShare = 'MyShare',
}

export const TRANSACTION_SCOPE_OPTIONS: TransactionScope[] =
  Object.values(TransactionScope);

export function isTransactionScope(value: string): value is TransactionScope {
  return TRANSACTION_SCOPE_OPTIONS.includes(value as TransactionScope);
}
// #endregion

// #region Enum Information
export interface TransactionScopeInfo {
  readonly id: TransactionScope;
  readonly display: string;
}

export const TRANSACTION_SCOPE_INFO: Record<
  TransactionScope,
  TransactionScopeInfo
> = {
  [TransactionScope.Group]: {
    id: TransactionScope.Group,
    display: 'Group',
  },
  [TransactionScope.MyShare]: {
    id: TransactionScope.MyShare,
    display: 'My share',
  },
} as const;

export const TRANSACTION_SCOPE_INFO_OPTIONS: TransactionScopeInfo[] =
  TRANSACTION_SCOPE_OPTIONS.map(
    (scope: TransactionScope): TransactionScopeInfo =>
      TRANSACTION_SCOPE_INFO[scope],
  );
// #endregion
