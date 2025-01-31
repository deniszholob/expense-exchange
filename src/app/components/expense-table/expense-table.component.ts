import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { User, usersToString, userToString } from 'src/app/api';
import { CellFormatterParamsExpense } from 'src/app/shared/cell-formatter-params-expense.type';
import { DetailedExpense } from 'src/app/shared/detailed-expense/detailed-expense.model';

import {
  SimpleTableComponent,
  TableAction,
} from '../simple-table/simple-table.component';
import { ColDef } from '../simple-table/simple-table.model';

@Component({
  selector: 'app-expense-table',
  templateUrl: './expense-table.component.html',

  imports: [CommonModule, SimpleTableComponent],
  providers: [DatePipe],
})
export class ExpenseTableComponent {
  public readonly expenses: InputSignal<DetailedExpense[]> =
    input.required<DetailedExpense[]>();

  public readonly add: OutputEmitterRef<void> = output<void>();
  public readonly edit: OutputEmitterRef<string> = output<string>();
  public readonly delete: OutputEmitterRef<string> = output<string>();

  protected columns: ColDef<DetailedExpense>[] = [
    // { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount' },
    { key: 'paidByUser', label: 'Paid By', cellFormatter: userFormatter },
    { key: 'paidForUsers', label: 'Paid For', cellFormatter: usersFormatter },
    {
      key: 'forDate',
      label: 'For Date',
      sortable: true,
      cellFormatter: getDateFormatter(this.datePipe),
    },
    {
      key: 'datePaid',
      label: 'Date Paid',
      sortable: true,
      cellFormatter: getDateFormatter(this.datePipe),
    },
  ];

  constructor(private datePipe: DatePipe) {}

  protected onEditRow(event: TableAction<DetailedExpense>): void {
    this.edit.emit(event.row.id);
  }

  protected onDeleteRow(event: TableAction<DetailedExpense>): void {
    const result: boolean = confirm(
      'Are you sure you want to delete this row?',
    );
    if (result) this.delete.emit(event.row.id);
  }

  protected onAddRow(): void {
    this.add.emit();
  }
}

function getDateFormatter(
  datePipe: DatePipe,
): (params: CellFormatterParamsExpense) => string {
  return (params: CellFormatterParamsExpense): string => {
    // checkParamKey(params.key, 'forDate');
    const val = params.value as string;
    const dateString: string = new Date(val).toISOString();
    return datePipe.transform(dateString, 'yyyy-MM-dd') ?? dateString;
  };
}

function userFormatter(params: CellFormatterParamsExpense): string {
  const user: User = params.value as User;
  return userToString(user);
}

function usersFormatter(params: CellFormatterParamsExpense): string {
  const users: User[] = params.value as User[];
  return usersToString(users);
}
