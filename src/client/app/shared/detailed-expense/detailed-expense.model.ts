import {
  ExpenseDto,
  GroupMemberDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';

export interface DetailedExpense extends ExpenseDto {
  paidByUser: GroupMemberDto;
  paidForUsers: GroupMemberDto[];
}
