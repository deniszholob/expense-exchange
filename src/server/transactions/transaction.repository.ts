// #region Imports
import type {
  CreateTransaction,
  Transaction,
} from '../../util/transaction.schema.js';
// #endregion

// #region Repository Contract
export abstract class TransactionRepository {
  public abstract getTransactions(): Promise<Transaction[]>;
  public abstract getTransaction(id: string): Promise<Transaction>;
  public abstract createTransaction(
    input: CreateTransaction,
    ownerUserId: string,
  ): Promise<Transaction>;
  public abstract updateTransaction(
    id: string,
    input: CreateTransaction,
    ownerUserId: string,
  ): Promise<Transaction>;
  public abstract deleteTransaction(id: string): Promise<Transaction>;
}
// #endregion
