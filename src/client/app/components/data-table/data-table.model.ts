// #region Model
import type { TemplateRef } from '@angular/core';

export enum SortDirection {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

export enum TableColumnPin {
  Left = 'Left',
  Right = 'Right',
}

export interface TableBaseData {
  readonly id: string;
}

export interface CellTemplateContext<TData extends TableBaseData> {
  readonly $implicit: TData;
  readonly row: TData;
  readonly value: TData[keyof TData];
  readonly column: ColDef<TData>;
}

export interface ColDef<TData extends TableBaseData> {
  readonly key: keyof TData;
  readonly label: string;
  readonly sortable?: boolean;
  readonly pinned?: TableColumnPin;
  readonly width?: string;
  readonly headerClass?: string;
  readonly cellClass?: string;
  readonly valueFormatter?: (value: TData[keyof TData], row: TData) => string;
  readonly cellTemplate?: TemplateRef<CellTemplateContext<TData>>;
  readonly tooltip?: (row: TData) => string | undefined;
  readonly sortValue?: (row: TData) => string | number | null | undefined;
}

export interface RenderTableCell<TData extends TableBaseData> {
  readonly column: ColDef<TData>;
  readonly pinnedOffset?: string;
  readonly pinnedEdge?: TableColumnPin;
  readonly value: TData[keyof TData];
  readonly displayValue: string;
  readonly tooltip?: string;
}

export interface RenderTableColumn<TData extends TableBaseData> {
  readonly definition: ColDef<TData>;
  readonly pinnedOffset?: string;
  readonly pinnedEdge?: TableColumnPin;
}

export interface RenderTableRow<
  TData extends TableBaseData,
> extends TableBaseData {
  readonly data: TData;
  readonly cells: readonly RenderTableCell<TData>[];
  readonly rowIndex: number;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly canView: boolean;
}

export interface SortState<TData extends TableBaseData> {
  readonly key: keyof TData;
  readonly direction: SortDirection;
}

export interface TableRowAction<TData extends TableBaseData> {
  readonly index: number;
  readonly row: TData;
}

export interface TableRowsReordered<TData extends TableBaseData> {
  readonly rows: readonly TData[];
  readonly movedRow: TData;
  readonly fromIndex: number;
  readonly toIndex: number;
}
// #endregion
