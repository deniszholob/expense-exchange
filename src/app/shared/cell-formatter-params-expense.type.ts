import { User } from '../api';
import { CellData } from '../components';
import { DetailedExpense } from './detailed-expense/detailed-expense.model';

export type CellFormatterParamsExpense = CellData<
  DetailedExpense,
  keyof DetailedExpense,
  string | number | string[] | User[] | User
>;
