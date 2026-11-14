// #region Imports
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionSchema } from '../../util/transaction.schema.js';
import type {
  CreateTransaction,
  Transaction,
} from '../../util/transaction.schema.js';
import { TransactionStoreSchema } from './transaction-store.schema.js';
import { TransactionType } from '../../util/transaction.schema.js';
import { TransactionRepository } from './transaction.repository.js';
import { JsonStore } from '../utils/json-store.js';
// #endregion

// #region JSON Adapter
@Injectable()
export class TransactionJsonAdapter extends TransactionRepository {
  private readonly store = new JsonStore(
    join(process.env['DATA_DIR'] ?? '.dist/data', 'transactions.json'),
    TransactionStoreSchema,
    () => ({ version: 2, transactions: [] }),
  );

  public async getTransactions(): Promise<Transaction[]> {
    return (await this.store.read()).transactions;
  }

  public async getTransaction(id: string): Promise<Transaction> {
    const transaction = (await this.store.read()).transactions.find(
      (item) => item.id === id,
    );
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  public async createTransaction(
    input: CreateTransaction,
    ownerUserId: string,
  ): Promise<Transaction> {
    return this.store.update((store) => {
      const transaction = TransactionSchema.parse({
        ...input,
        id: randomUUID(),
        ...(input.type === TransactionType.Expense ? {} : { ownerUserId }),
      });
      store.transactions.push(transaction);
      return transaction;
    });
  }

  public async updateTransaction(
    id: string,
    input: CreateTransaction,
    ownerUserId: string,
  ): Promise<Transaction> {
    return this.store.update((store) => {
      const index = store.transactions.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('Transaction not found');
      const existing = store.transactions[index]!;
      const transaction = TransactionSchema.parse({
        ...input,
        id,
        ...(input.type === TransactionType.Expense
          ? {}
          : { ownerUserId: existing.ownerUserId ?? ownerUserId }),
      });
      store.transactions[index] = transaction;
      return transaction;
    });
  }

  public async deleteTransaction(id: string): Promise<Transaction> {
    return this.store.update((store) => {
      const index = store.transactions.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('Transaction not found');
      return store.transactions.splice(index, 1)[0]!;
    });
  }
}
// #endregion
