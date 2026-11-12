import { UserDto } from '../../api/generated/expense-exchange-api.schemas';
import { CellData } from '../components';
import { DetailedExpense } from './detailed-expense/detailed-expense.model';

export type CellFormatterParamsExpense = CellData<
  DetailedExpense,
  keyof DetailedExpense,
  string | number | string[] | UserDto[] | UserDto
>;
