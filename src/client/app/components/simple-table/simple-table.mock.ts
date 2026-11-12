import { DatePipe } from '@angular/common';
import { ExpenseDto } from 'src/client/api/generated/expense-exchange-api.schemas';

import { CellData, checkParamKey, ColDef } from './simple-table.model';

const datePipe = new DatePipe('en-US');

export type CellFormatterParams = CellData<
  ExpenseDto,
  keyof ExpenseDto,
  string | number | string[]
>;
export const MOCK_ColDef_Expense: ColDef<ExpenseDto>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'forDate',
    label: 'For Date',
    sortable: true,
    cellFormatter: (params: CellFormatterParams): string => {
      checkParamKey(params.key, 'forDate');
      console.log(params);
      const val = params.value as string;
      const dateString: string = new Date(val).toISOString();
      return datePipe.transform(dateString, 'yyyy-MM-dd') ?? dateString;
    },
  },
  {
    key: 'paidByUserId',
    label: 'Paid By User ID',
    cellFormatter: (): string => {
      return 'bob';
    },
  },
  { key: 'paidForUserIds', label: 'Paid For User IDs' },
  { key: 'description', label: 'Description' },
];
