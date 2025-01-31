import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import {
  ColDef,
  RenderTableCell,
  RenderTableRow,
  SortDirection,
  TableBaseData,
} from './simple-table.model';

export type TableAction<TData> = {
  i: number;
  row: RenderTableRow<TData>;
};

@Component({
  selector: 'app-simple-table',
  templateUrl: './simple-table.component.html',
  imports: [CommonModule],
})
export class SimpleTableComponent<
  TData extends Record<string, any> & TableBaseData,
> {
  public readonly data: InputSignal<TData[]> = input.required<TData[]>();
  public readonly columns: InputSignal<ColDef<TData>[]> =
    input.required<ColDef<TData>[]>();
  public readonly striped: InputSignal<boolean> = input<boolean>(true);

  public editRowEmitter: OutputEmitterRef<TableAction<TData>> =
    output<TableAction<TData>>();
  public deleteRowEmitter: OutputEmitterRef<TableAction<TData>> =
    output<TableAction<TData>>();
  public addRowEmitter: OutputEmitterRef<void> = output<void>();

  constructor(private domSanitizer: DomSanitizer) {}

  protected renderTable: Signal<RenderTableRow<TData>[]> = computed(
    (): RenderTableRow<TData>[] => {
      const rows: TData[] = this.data();
      const cols: ColDef<TData>[] = this.columns();
      const renderTableRow: RenderTableRow<TData>[] = rows.map(
        (row: TData): RenderTableRow<TData> => this.getTableRow(row, cols),
      );
      return renderTableRow;
    },
  );

  private getTableRow(
    dataEntry: TData,
    cols: ColDef<TData>[],
  ): RenderTableRow<TData> {
    return {
      id: dataEntry.id,
      data: dataEntry,
      cells: cols.map(
        (col: ColDef<TData>): RenderTableCell<TData> =>
          this.getTableCell(dataEntry, col),
      ),
    };
  }

  private getTableCell(row: TData, col: ColDef<TData>): RenderTableCell<TData> {
    const formattedValue: string | undefined = col.cellFormatter?.({
      colDef: col,
      rowData: row,
      value: row[col.key],
      key: col.key,
    });

    const rawValue: TData[keyof TData] = row[col.key];
    const renderTableCell: RenderTableCell<TData> = {
      ...col,
      rawValue,
      cellValue: this.domSanitizer.bypassSecurityTrustHtml(
        typeof formattedValue === 'string' ? formattedValue : rawValue,
      ),
    };

    return renderTableCell;
  }

  protected sortKey: keyof TData | null = null;
  protected sortDirection: SortDirection;

  protected sort(column: ColDef<TData>): void {
    if (!column.sortable) return;

    if (this.sortKey === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column.key;
      this.sortDirection = 'asc';
    }

    this.data().sort((a: TData, b: TData): 0 | 1 | -1 => {
      if (this.sortKey === null) return 0;
      const valueA: TData[keyof TData] = a[this.sortKey];
      const valueB: TData[keyof TData] = b[this.sortKey];

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  protected onEdit(i: number, row: RenderTableRow<TData>): void {
    this.editRowEmitter.emit({ i, row });
  }

  protected onDelete(i: number, row: RenderTableRow<TData>): void {
    this.deleteRowEmitter.emit({ i, row });
  }

  protected onAdd(): void {
    this.addRowEmitter.emit();
  }
}
