import {
  ExpenseDto,
  UserDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';

export interface DetailedExpense extends ExpenseDto {
  paidByUser: UserDto;
  paidForUsers: UserDto[];
}
