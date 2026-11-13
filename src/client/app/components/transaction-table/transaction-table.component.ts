// #region Imports
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { TemplateRef } from '@angular/core';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import { DataTableComponent } from 'src/client/app/components/data-table/data-table.component';
import type {
  CellTemplateContext,
  ColDef,
  TableRowAction,
} from 'src/client/app/components/data-table/data-table.model';
// #endregion

// #region Models
export interface TransactionRow {
  readonly id: string;
  readonly kind: TransactionType;
  readonly amount: number;
  readonly name: string;
  readonly description: string;
  readonly party: string;
  readonly beneficiaries: string;
  readonly date: string;
  readonly recordedDate: string;
  readonly rangeDate: string;
  readonly memberUserIds: readonly string[];
  readonly canManage: boolean;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transaction-table',
  templateUrl: './transaction-table.component.html',
  host: { class: 'contents' },
  imports: [CurrencyPipe, DataTableComponent],
})
export class TransactionTableComponent {
  protected readonly TransactionType = TransactionType;
  public readonly $rows = input.required<readonly TransactionRow[]>();
  public readonly $totalResults = input<number | undefined>();
  public readonly addRequested = output<void>();
  public readonly editRequested = output<TransactionRow>();
  public readonly deleteRequested = output<TransactionRow>();

  protected readonly $typeCell =
    viewChild.required<TemplateRef<CellTemplateContext<TransactionRow>>>(
      'typeCell',
    );
  protected readonly $amountCell =
    viewChild.required<TemplateRef<CellTemplateContext<TransactionRow>>>(
      'amountCell',
    );
  protected readonly $columns = computed<readonly ColDef<TransactionRow>[]>(
    () => [
      {
        key: 'kind',
        label: 'Type',
        sortable: true,
        headerClass: 'w-24',
        cellTemplate: this.$typeCell(),
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        headerClass: 'w-36 text-right',
        cellClass: 'text-right font-semibold tabular-nums',
        cellTemplate: this.$amountCell(),
        sortValue: (row) =>
          row.kind === TransactionType.Expense ? -row.amount : row.amount,
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        cellClass: 'truncate',
        tooltip: (row) => row.description || undefined,
      },
      {
        key: 'party',
        label: 'Paid / received by',
        sortable: true,
        cellClass: 'truncate',
      },
      {
        key: 'beneficiaries',
        label: 'Beneficiaries',
        sortable: true,
        cellClass: 'text-finance-muted truncate',
      },
      {
        key: 'date',
        label: 'For date',
        sortable: true,
        headerClass: 'w-32',
        cellClass: 'tabular-nums',
        valueFormatter: (value) => String(value).slice(0, 10),
      },
      {
        key: 'recordedDate',
        label: 'Paid / received',
        sortable: true,
        headerClass: 'w-36',
        cellClass: 'tabular-nums',
        valueFormatter: (value) => String(value).slice(0, 10),
      },
    ],
  );
  protected readonly canManageRow = (row: TransactionRow): boolean =>
    row.canManage;

  protected editRow(action: TableRowAction<TransactionRow>): void {
    this.editRequested.emit(action.row);
  }

  protected deleteRow(action: TableRowAction<TransactionRow>): void {
    const row = action.row;
    if (confirm(`Delete this ${row.kind.toLowerCase()}?`))
      this.deleteRequested.emit(row);
  }
}
// #endregion
