// #region Imports
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateTransaction,
  Transaction,
} from '../../util/transaction.schema.js';
import { TransactionType } from '../../util/transaction.schema.js';
import { TransactionRepository } from './transaction.repository.js';
// #endregion

// #region Service
@Injectable()
export class TransactionService {
  public constructor(private readonly repository: TransactionRepository) {}

  public async getTransactions(userId: string): Promise<Transaction[]> {
    const transactions = await this.repository.getTransactions();
    return transactions.filter(
      (transaction) =>
        transaction.type === TransactionType.Expense ||
        transaction.ownerUserId === userId ||
        transaction.targetUserId === userId ||
        transaction.beneficiaryUserIds.includes(userId),
    );
  }

  public getTransaction(id: string): Promise<Transaction> {
    return this.repository.getTransaction(id);
  }

  public createTransaction(
    input: CreateTransaction,
    ownerUserId: string,
  ): Promise<Transaction> {
    return this.repository.createTransaction(input, ownerUserId);
  }

  public async updateTransaction(
    id: string,
    input: CreateTransaction,
    userId: string,
  ): Promise<Transaction> {
    const existing = await this.repository.getTransaction(id);
    if (
      existing.type !== TransactionType.Expense &&
      existing.ownerUserId !== userId
    )
      throw new ForbiddenException('Only the transaction owner can change it');
    return this.repository.updateTransaction(id, input, userId);
  }

  public async deleteTransaction(
    id: string,
    userId: string,
  ): Promise<Transaction> {
    const transaction = await this.repository.getTransaction(id);
    if (
      transaction.type !== TransactionType.Expense &&
      transaction.ownerUserId !== userId
    )
      throw new ForbiddenException('Only the transaction owner can change it');
    if (transaction.type === TransactionType.Expense) {
      const transactions = await this.repository.getTransactions();
      if (
        transactions.some(
          (candidate) =>
            candidate.type === TransactionType.Refund &&
            candidate.linkedTransactionId === transaction.id,
        )
      )
        throw new ConflictException(
          'Transaction is linked to one or more refunds',
        );
    }
    return this.repository.deleteTransaction(id);
  }

  public async validateLinkedTransaction(
    input: CreateTransaction,
  ): Promise<void> {
    if (input.type !== TransactionType.Refund || !input.linkedTransactionId)
      return;
    const linked = await this.repository
      .getTransaction(input.linkedTransactionId)
      .catch((error: unknown) => {
        if (error instanceof NotFoundException)
          throw new ConflictException('Linked transaction was not found');
        throw error;
      });
    if (linked.type !== TransactionType.Expense)
      throw new ConflictException('Refunds can only link to expenses');
  }
}
// #endregion
