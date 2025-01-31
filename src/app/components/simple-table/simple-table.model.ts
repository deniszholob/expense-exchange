import { SafeHtml } from '@angular/platform-browser';

export type SortDirection = 'asc' | 'desc' | undefined;

interface ColDefBase<TData> {
  key: keyof TData;
  label: string;
  sortable?: boolean;
}

export type TableBaseData = {
  id: string;
};

export interface RenderTableRow<TData> extends TableBaseData {
  data: TData;
  cells: RenderTableCell<TData>[];
}

export interface RenderTableCell<TData> extends ColDefBase<TData> {
  rawValue: TData[keyof TData];
  cellValue: SafeHtml;
}

export interface ColDef<TData> extends ColDefBase<TData> {
  cellFormatter?: CellFormatterFn<TData, keyof TData>;
}

export interface CellFormatterFn<
  TData,
  TKey extends keyof TData,
  TValue = TKey extends keyof TData ? TData[TKey] : string,
> {
  (params: CellData<TData, TKey, TValue>): string;
}
export interface CellData<
  TData,
  TKey extends keyof TData,
  TValue = TKey extends keyof TData ? TData[TKey] : string,
> {
  colDef: ColDef<TData>;
  rowData: TData;
  value: TValue;
  key: TKey;
}

export function checkParamKey<TData>(
  paramKeyActual: keyof TData,
  paramKeyExpected: keyof TData,
): void {
  if (paramKeyActual !== paramKeyExpected)
    throw new Error(
      `Key Mismatch: Expected  ${String(paramKeyExpected)} but got ${String(paramKeyActual)}`,
    );
}
