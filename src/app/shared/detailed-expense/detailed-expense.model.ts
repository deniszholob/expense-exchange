import { Expense, User } from 'src/app/api';

export interface DetailedExpense extends Expense {
  paidByUser: User;
  paidForUsers: User[];
}
