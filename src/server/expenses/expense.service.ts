// #region Imports
import { Injectable } from '@nestjs/common';
import type { CreateExpenseDto, ExpenseDto } from './expense.dto.js';
import { ExpenseRepository } from './expense.repository.js';
// #endregion

// #region Service
@Injectable()
export class ExpenseService {
  public constructor(private readonly repository: ExpenseRepository) {}

  public getExpenses(): Promise<ExpenseDto[]> {
    return this.repository.getExpenses();
  }

  public getExpense(id: string): Promise<ExpenseDto> {
    return this.repository.getExpense(id);
  }

  public createExpense(input: CreateExpenseDto): Promise<ExpenseDto> {
    return this.repository.createExpense(input);
  }

  public updateExpense(
    id: string,
    input: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.repository.updateExpense(id, input);
  }

  public deleteExpense(id: string): Promise<ExpenseDto> {
    return this.repository.deleteExpense(id);
  }
}
// #endregion
