export interface Expense {
  id: string;
  name: string;
  description: string;
  amount: number;
  datePaid: string;
  forDate: string;
  paidByUserId: string;
  paidForUserIds: string[];
  // repeatPeriod: RepeatPeriod;
}
