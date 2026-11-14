// #region Imports
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  LucideArrowDown,
  LucideArrowDownUp,
  LucideArrowUp,
  LucideChevronLeft,
  LucideChevronRight,
  LucideEye,
  LucideGripVertical,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { SortDirection, TableColumnPin } from './data-table.model';
import type {
  ColDef,
  RenderTableCell,
  RenderTableColumn,
  RenderTableRow,
  SortState,
  TableBaseData,
  TableRowAction,
  TableRowsReordered,
} from './data-table.model';
// #endregion

// #region Constants
const PAGE_SIZE_STORAGE_KEY = 'expense-exchange.data-table-page-size';
const PAGE_SIZE_OPTIONS: readonly (number | 'all')[] = [10, 25, 50, 'all'];
const REORDER_COLUMN_WIDTH = '2.5rem';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    NgTemplateOutlet,
    LucideArrowDown,
    LucideArrowDownUp,
    LucideArrowUp,
    LucideChevronLeft,
    LucideChevronRight,
    LucideEye,
    LucideGripVertical,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  host: { class: 'contents' },
})
export class DataTableComponent<TData extends TableBaseData> {
  protected readonly TableColumnPin = TableColumnPin;
  protected readonly SortDirection = SortDirection;
  public readonly $data = input.required<readonly TData[]>();
  public readonly $totalResults = input<number | undefined>();
  public readonly $columns = input.required<readonly ColDef<TData>[]>();
  public readonly $tableClass = input('');
  public readonly $title = input('Data table');
  public readonly $caption = input('');
  public readonly $emptyMessage = input('No rows to display.');
  public readonly $addActionLabel = input('Add row');
  public readonly $showAddAction = input(true);
  public readonly $showViewAction = input(false);
  public readonly $showEditAction = input(true);
  public readonly $showDeleteAction = input(true);
  public readonly $enableRowReordering = input(false);
  public readonly $actionsPinned = input<TableColumnPin | undefined>(undefined);
  public readonly $actionsWidth = input('7rem');
  public readonly $striped = input(false);
  public readonly $canEditRow = input<(row: TData) => boolean>(() => true);
  public readonly $canViewRow = input<(row: TData) => boolean>(() => true);
  public readonly $canDeleteRow = input<(row: TData) => boolean>(() => true);
  public readonly $defaultSort = input<SortState<TData> | undefined>(undefined);
  public readonly addRequested = output<void>();
  public readonly viewRequested = output<TableRowAction<TData>>();
  public readonly editRequested = output<TableRowAction<TData>>();
  public readonly deleteRequested = output<TableRowAction<TData>>();
  public readonly rowsReordered = output<TableRowsReordered<TData>>();

  protected readonly $sortState = linkedSignal(() => this.$defaultSort());
  protected readonly $displayData = linkedSignal(() => this.$data());
  protected readonly $currentPage = signal(1);
  protected readonly $pageSize = signal<number | 'all'>(readSavedPageSize());
  protected readonly $pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly $filteredResults = computed(() => this.$data().length);
  protected readonly $hasRightPinnedColumns = computed(() =>
    this.$columns().some((column) => column.pinned === TableColumnPin.Right),
  );
  protected readonly $hasLeftPinnedColumns = computed(() =>
    this.$columns().some((column) => column.pinned === TableColumnPin.Left),
  );
  protected readonly $columnLayout = computed<
    readonly RenderTableColumn<TData>[]
  >(() => {
    const columns = this.$columns();
    const leftPinnedColumns = columns.filter(
      (column) => column.pinned === TableColumnPin.Left,
    );
    const rightPinnedColumns = columns.filter(
      (column) => column.pinned === TableColumnPin.Right,
    );
    let leftWidths: string[] = this.$enableRowReordering()
      ? [REORDER_COLUMN_WIDTH]
      : [];
    let rightWidths: string[] =
      this.$hasRowActions() && this.$actionsPinned() === TableColumnPin.Right
        ? [this.$actionsWidth()]
        : [];

    const leftOffsets = new Map<keyof TData, string>();
    for (const column of leftPinnedColumns) {
      leftOffsets.set(column.key, this.offsetFromWidths(leftWidths));
      leftWidths = [...leftWidths, column.width ?? '12rem'];
    }

    const rightOffsets = new Map<keyof TData, string>();
    for (const column of [...rightPinnedColumns].reverse()) {
      rightOffsets.set(column.key, this.offsetFromWidths(rightWidths));
      rightWidths = [...rightWidths, column.width ?? '12rem'];
    }

    return columns.map((definition) => ({
      definition,
      pinnedEdge:
        definition.pinned === TableColumnPin.Left &&
        this.$actionsPinned() !== TableColumnPin.Left &&
        leftPinnedColumns.at(-1)?.key === definition.key
          ? TableColumnPin.Right
          : definition.pinned === TableColumnPin.Right &&
              rightPinnedColumns[0]?.key === definition.key
            ? TableColumnPin.Left
            : undefined,
      pinnedOffset:
        definition.pinned === TableColumnPin.Left
          ? leftOffsets.get(definition.key)
          : definition.pinned === TableColumnPin.Right
            ? rightOffsets.get(definition.key)
            : undefined,
    }));
  });
  protected readonly $actionsPinnedOffset = computed(() => {
    if (!this.$hasRowActions() || !this.$actionsPinned()) return undefined;
    if (this.$actionsPinned() === TableColumnPin.Right) return '0px';

    const leftColumnWidths = this.$columns()
      .filter((column) => column.pinned === TableColumnPin.Left)
      .map((column) => column.width ?? '12rem');
    const widths = this.$enableRowReordering()
      ? [REORDER_COLUMN_WIDTH, ...leftColumnWidths]
      : leftColumnWidths;
    return this.offsetFromWidths(widths);
  });
  protected readonly $totalResultCount = computed(
    () => this.$totalResults() ?? this.$filteredResults(),
  );
  protected readonly $pageCount = computed(() => {
    const pageSize = this.$pageSize();
    return Math.max(
      1,
      pageSize === 'all' ? 1 : Math.ceil(this.$sortedData().length / pageSize),
    );
  });
  protected readonly $effectivePage = computed(() =>
    Math.min(this.$currentPage(), this.$pageCount()),
  );
  protected readonly $rangeStart = computed(() => {
    const pageSize = this.$pageSize();
    if (this.$sortedData().length === 0) return 0;
    return pageSize === 'all' ? 1 : (this.$effectivePage() - 1) * pageSize + 1;
  });
  protected readonly $rangeEnd = computed(() => {
    const pageSize = this.$pageSize();
    return Math.min(
      pageSize === 'all'
        ? this.$sortedData().length
        : this.$effectivePage() * pageSize,
      this.$sortedData().length,
    );
  });
  protected readonly $renderRows = computed(() => {
    const columns = this.$columnLayout();
    const pageSize = this.$pageSize();
    const firstRowIndex =
      pageSize === 'all' ? 0 : (this.$effectivePage() - 1) * pageSize;
    return this.$sortedData()
      .slice(
        firstRowIndex,
        pageSize === 'all' ? undefined : firstRowIndex + pageSize,
      )
      .map((row, rowIndex): RenderTableRow<TData> => ({
        id: row.id,
        data: row,
        cells: columns.map(
          ({
            definition,
            pinnedOffset,
            pinnedEdge,
          }): RenderTableCell<TData> => {
            const column = definition;
            const value = row[column.key];
            return {
              column,
              pinnedOffset,
              pinnedEdge,
              value,
              displayValue: column.valueFormatter
                ? column.valueFormatter(value, row)
                : this.formatDefaultValue(value),
              tooltip: column.tooltip?.(row),
            };
          },
        ),
        canEdit: this.$showEditAction() && this.$canEditRow()(row),
        canView: this.$showViewAction() && this.$canViewRow()(row),
        canDelete: this.$showDeleteAction() && this.$canDeleteRow()(row),
        rowIndex: firstRowIndex + rowIndex,
      }));
  });
  protected readonly $dropListRows = computed<RenderTableRow<TData>[]>(() => [
    ...this.$renderRows(),
  ]);
  protected readonly $hasRowActions = computed(
    () =>
      this.$showViewAction() ||
      this.$showEditAction() ||
      this.$showDeleteAction(),
  );
  protected sort(column: ColDef<TData>): void {
    if (!column.sortable || this.$enableRowReordering()) return;

    const currentState = this.$sortState();
    const nextState: SortState<TData> | undefined =
      currentState?.key !== column.key
        ? { key: column.key, direction: SortDirection.Ascending }
        : currentState.direction === SortDirection.Ascending
          ? { key: column.key, direction: SortDirection.Descending }
          : undefined;
    this.$sortState.set(nextState);
    this.$currentPage.set(1);
  }

  protected goToPreviousPage(): void {
    this.$currentPage.set(Math.max(1, this.$effectivePage() - 1));
  }

  protected goToNextPage(): void {
    this.$currentPage.set(
      Math.min(this.$pageCount(), this.$effectivePage() + 1),
    );
  }

  protected setPageSize(event: Event): void {
    if (!(event.currentTarget instanceof HTMLSelectElement)) return;

    const selectedValue = event.currentTarget.value;
    const newPageSize = selectedValue === 'all' ? 'all' : Number(selectedValue);
    if (this.$pageSizeOptions.includes(newPageSize)) {
      this.$pageSize.set(newPageSize);
      this.$currentPage.set(1);
      try {
        window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(newPageSize));
      } catch {
        // Keep the selection for this session when browser storage is unavailable.
      }
    }
  }

  protected requestAdd(): void {
    this.addRequested.emit();
  }

  protected requestEdit(row: RenderTableRow<TData>): void {
    this.editRequested.emit({ index: row.rowIndex, row: row.data });
  }

  protected requestView(row: RenderTableRow<TData>): void {
    this.viewRequested.emit({ index: row.rowIndex, row: row.data });
  }

  protected requestDelete(row: RenderTableRow<TData>): void {
    this.deleteRequested.emit({ index: row.rowIndex, row: row.data });
  }

  protected dropRow(event: CdkDragDrop<RenderTableRow<TData>[]>): void {
    if (
      !this.$enableRowReordering() ||
      event.previousIndex === event.currentIndex
    )
      return;

    const pageSize = this.$pageSize();
    const pageOffset =
      pageSize === 'all' ? 0 : (this.$effectivePage() - 1) * pageSize;
    this.moveRow(
      pageOffset + event.previousIndex,
      pageOffset + event.currentIndex,
    );
  }

  protected moveRowWithKeyboard(
    index: number,
    offset: number,
    event: Event,
  ): void {
    if (!this.$enableRowReordering()) return;
    event.preventDefault();
    this.moveRow(
      index,
      Math.max(0, Math.min(this.$displayData().length - 1, index + offset)),
    );
  }

  private readonly $sortedData = computed(() => {
    const rows = this.$enableRowReordering()
      ? this.$displayData()
      : this.$data();
    if (this.$enableRowReordering()) return rows;
    const sortState = this.$sortState();
    const column = this.$columns().find(
      (candidate) => candidate.key === sortState?.key,
    );
    if (!sortState || !column?.sortable) return rows;

    const direction = sortState.direction === SortDirection.Ascending ? 1 : -1;
    return [...rows].sort((firstRow, secondRow) => {
      const firstValue =
        column.sortValue?.(firstRow) ?? firstRow[sortState.key];
      const secondValue =
        column.sortValue?.(secondRow) ?? secondRow[sortState.key];
      return this.compareValues(firstValue, secondValue) * direction;
    });
  });

  private moveRow(fromIndex: number, toIndex: number): void {
    const rows = this.$displayData();
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= rows.length ||
      toIndex >= rows.length
    )
      return;

    const reorderedRows = [...rows];
    const movedRow = reorderedRows[fromIndex];
    if (!movedRow) return;
    moveItemInArray(reorderedRows, fromIndex, toIndex);
    this.$displayData.set(reorderedRows);
    this.rowsReordered.emit({
      rows: reorderedRows,
      movedRow,
      fromIndex,
      toIndex,
    });
  }

  private compareValues(firstValue: unknown, secondValue: unknown): number {
    if (firstValue === secondValue) return 0;
    if (firstValue === null || firstValue === undefined) return -1;
    if (secondValue === null || secondValue === undefined) return 1;
    if (typeof firstValue === 'number' && typeof secondValue === 'number')
      return firstValue - secondValue;

    return String(firstValue).localeCompare(String(secondValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private formatDefaultValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map(String).join(', ');
    if (typeof value === 'object') return JSON.stringify(value) ?? '';
    return String(value);
  }

  private offsetFromWidths(widths: readonly string[]): string {
    return widths.length === 0 ? '0px' : `calc(${widths.join(' + ')})`;
  }
}
// #endregion

// #region Helpers
function readSavedPageSize(): number | 'all' {
  try {
    const storedPageSize = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (storedPageSize === 'all') return 'all';

    const pageSize = Number(storedPageSize);
    return PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : 10;
  } catch {
    return 10;
  }
}
// #endregion
