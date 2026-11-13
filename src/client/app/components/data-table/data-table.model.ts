// #region Model
import type { TemplateRef } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

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
  readonly headerClass?: string;
  readonly cellClass?: string;
  readonly valueFormatter?: (value: TData[keyof TData], row: TData) => string;
  readonly cellTemplate?: TemplateRef<CellTemplateContext<TData>>;
  readonly tooltip?: (row: TData) => string | undefined;
  readonly sortValue?: (row: TData) => string | number | null | undefined;
}

export interface RenderTableCell<TData extends TableBaseData> {
  readonly column: ColDef<TData>;
  readonly value: TData[keyof TData];
  readonly displayValue: string;
  readonly tooltip?: string;
}

export interface RenderTableRow<
  TData extends TableBaseData,
> extends TableBaseData {
  readonly data: TData;
  readonly cells: readonly RenderTableCell<TData>[];
  readonly rowIndex: number;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
}

export interface SortState<TData extends TableBaseData> {
  readonly key: keyof TData;
  readonly direction: SortDirection;
}

export interface TableRowAction<TData extends TableBaseData> {
  readonly index: number;
  readonly row: TData;
}
// #endregion
