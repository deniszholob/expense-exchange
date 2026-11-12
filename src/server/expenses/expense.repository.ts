// #region Imports
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import type { CreateExpenseDto, ExpenseDto } from './expense.dto.js';
import type {
  GroupMemberDto,
  GroupMemberProfileDto,
} from '../groups/group-member.dto.js';
import { INITIAL_EXPENSE_STORE } from './expense.seed.js';
// #endregion

// #region Contracts
const ExpenseSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  amount: z.number(),
  datePaid: z.string(),
  forDate: z.string(),
  paidByUserId: z.string(),
  paidForUserIds: z.array(z.string()),
});

const UserSchema = z.object({ id: z.string().min(1), name: z.string() });
const StoreSchema = z.object({
  version: z.literal(1),
  users: z.array(UserSchema),
  expenses: z.array(ExpenseSchema),
});

export type ExpenseStore = z.infer<typeof StoreSchema>;

export abstract class ExpenseRepository {
  public abstract getGroupMembers(): Promise<GroupMemberDto[]>;
  public abstract createGroupMember(
    input: GroupMemberProfileDto,
    id?: string,
  ): Promise<GroupMemberDto>;
  public abstract updateGroupMember(
    id: string,
    input: GroupMemberProfileDto,
  ): Promise<GroupMemberDto>;
  public abstract deleteGroupMember(id: string): Promise<GroupMemberDto>;
  public abstract getExpenses(): Promise<ExpenseDto[]>;
  public abstract getExpense(id: string): Promise<ExpenseDto>;
  public abstract createExpense(input: CreateExpenseDto): Promise<ExpenseDto>;
  public abstract updateExpense(
    id: string,
    input: CreateExpenseDto,
  ): Promise<ExpenseDto>;
  public abstract deleteExpense(id: string): Promise<ExpenseDto>;
}
// #endregion

// #region JSON Adapter
@Injectable()
export class JsonExpenseRepository extends ExpenseRepository {
  private readonly dataDirectory = process.env['DATA_DIR'] ?? '.dist/data';
  private readonly dataFile = join(this.dataDirectory, 'expenses.json');
  private writeQueue: Promise<void> = Promise.resolve();

  public async getGroupMembers(): Promise<GroupMemberDto[]> {
    return (await this.readStore()).users;
  }

  public async createGroupMember(
    input: GroupMemberProfileDto,
    id?: string,
  ): Promise<GroupMemberDto> {
    return this.updateStore((store) => {
      const user: GroupMemberDto = { ...input, id: id ?? randomUUID() };
      store.users.push(user);
      return user;
    });
  }

  public async updateGroupMember(
    id: string,
    input: GroupMemberProfileDto,
  ): Promise<GroupMemberDto> {
    return this.updateStore((store) => {
      const index = store.users.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('User not found');
      const user: GroupMemberDto = { ...input, id };
      store.users[index] = user;
      return user;
    });
  }

  public async deleteGroupMember(id: string): Promise<GroupMemberDto> {
    return this.updateStore((store) => {
      const index = store.users.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('User not found');
      const isReferenced = store.expenses.some(
        (expense) =>
          expense.paidByUserId === id || expense.paidForUserIds.includes(id),
      );
      if (isReferenced) {
        throw new ConflictException(
          'User is referenced by one or more expenses',
        );
      }
      return store.users.splice(index, 1)[0]!;
    });
  }

  public async getExpenses(): Promise<ExpenseDto[]> {
    return (await this.readStore()).expenses;
  }

  public async getExpense(id: string): Promise<ExpenseDto> {
    const expense = (await this.readStore()).expenses.find(
      (item) => item.id === id,
    );
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  public async createExpense(input: CreateExpenseDto): Promise<ExpenseDto> {
    return this.updateStore((store) => {
      const expense: ExpenseDto = { ...input, id: randomUUID() };
      store.expenses.push(expense);
      return expense;
    });
  }

  public async updateExpense(
    id: string,
    input: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.updateStore((store) => {
      const index = store.expenses.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('Expense not found');
      const expense: ExpenseDto = { ...input, id };
      store.expenses[index] = expense;
      return expense;
    });
  }

  public async deleteExpense(id: string): Promise<ExpenseDto> {
    return this.updateStore((store) => {
      const index = store.expenses.findIndex((item) => item.id === id);
      if (index < 0) throw new NotFoundException('Expense not found');
      return store.expenses.splice(index, 1)[0]!;
    });
  }

  private initializeStorePromise: Promise<ExpenseStore> | undefined;

  private async readStore(): Promise<ExpenseStore> {
    await mkdir(this.dataDirectory, { recursive: true });
    try {
      const contents = await readFile(this.dataFile, 'utf8');
      return StoreSchema.parse(JSON.parse(contents));
    } catch (error: unknown) {
      if (isMissingFile(error)) {
        return this.initializeStore();
      }
      throw error;
    }
  }

  private initializeStore(): Promise<ExpenseStore> {
    if (!this.initializeStorePromise) {
      this.initializeStorePromise = (async (): Promise<ExpenseStore> => {
        try {
          const contents = await readFile(this.dataFile, 'utf8');
          return StoreSchema.parse(JSON.parse(contents));
        } catch (error: unknown) {
          if (!isMissingFile(error)) throw error;
          await this.writeStore(INITIAL_EXPENSE_STORE);
          return structuredClone(INITIAL_EXPENSE_STORE);
        }
      })();
    }
    return this.initializeStorePromise;
  }

  private async updateStore<T>(
    operation: (store: ExpenseStore) => T,
  ): Promise<T> {
    const result = this.writeQueue.then(async () => {
      const store = await this.readStore();
      const output = operation(store);
      await this.writeStore(store);
      return output;
    });
    this.writeQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async writeStore(store: ExpenseStore): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true });
    const temporaryFile = `${this.dataFile}.${randomUUID()}.tmp`;
    await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryFile, this.dataFile);
  }
}
// #endregion

// #region Helpers
function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
// #endregion
