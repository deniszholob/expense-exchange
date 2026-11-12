// #region Imports
import { Injectable } from '@nestjs/common';
import { ExpenseRepository } from '../expenses/expense.repository.js';
import type { CreateUserDto, UserDto } from './user.dto.js';
// #endregion

// #region Service
@Injectable()
export class UserService {
  public constructor(private readonly repository: ExpenseRepository) {}

  public getUsers(): Promise<UserDto[]> {
    return this.repository.getUsers();
  }

  public createUser(input: CreateUserDto): Promise<UserDto> {
    return this.repository.createUser(input);
  }

  public updateUser(id: string, input: CreateUserDto): Promise<UserDto> {
    return this.repository.updateUser(id, input);
  }

  public deleteUser(id: string): Promise<UserDto> {
    return this.repository.deleteUser(id);
  }
}
// #endregion
