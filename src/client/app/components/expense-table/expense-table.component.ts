// #region Imports
import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { GroupMemberDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { CellFormatterParamsExpense } from 'src/client/app/shared/cell-formatter-params-expense.type';
import { DetailedExpense } from 'src/client/app/shared/detailed-expense/detailed-expense.model';
import { usersToString, userToString } from 'src/client/app/shared/user.util';

import {
  SimpleTableComponent,
  TableAction,
} from '../simple-table/simple-table.component';
import { ColDef } from '../simple-table/simple-table.model';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    { key: 'amount', label: 'Amount', cellFormatter: amountFormatter },
    {
      key: 'name',
      label: 'Name',
      tooltip: (expense) => expense.description,
    },
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

  public constructor(private datePipe: DatePipe) {}

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
  const user: GroupMemberDto = params.value as GroupMemberDto;
  return userToString(user);
}

function usersFormatter(params: CellFormatterParamsExpense): string {
  const users: GroupMemberDto[] = params.value as GroupMemberDto[];
  return usersToString(users);
}

function amountFormatter(params: CellFormatterParamsExpense): string {
  return `−${USD_FORMATTER.format(Math.abs(Number(params.value)))}`;
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// #endregion
