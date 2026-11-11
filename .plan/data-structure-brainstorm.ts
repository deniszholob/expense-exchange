// Expense App Data Structure
export enum RepeatPeriod {
  ONE_TIME = 'ONE_TIME',
  WEEKLY = 'WEEKLY',
  BI_WEEKLY = 'BI_WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}
export interface Expense {
  //   guid: string;
  amount: number;
  subject: string;
  paymentTypeId: string;
  date: Date;
  paidBy: string;
  paidFor: string[];
  repeatPeriod: RepeatPeriod;
}

export interface PaymentType {
  id: string;
  name: string;
  payPeriodDay: number;
  dueDay: number;
}

export interface User {
  guid: string;
  name: string;
}

// interface ExpensesSummary {
//   expense: Expense[];
//   paidDate: Date;
// }
