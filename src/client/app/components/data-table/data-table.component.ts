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
  LucideArrowDown,
  LucideArrowDownUp,
  LucideArrowUp,
  LucideChevronLeft,
  LucideChevronRight,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import type {
  ColDef,
  RenderTableCell,
  RenderTableRow,
  SortState,
  TableBaseData,
  TableRowAction,
} from './data-table.model';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  imports: [
    NgTemplateOutlet,
    LucideArrowDown,
    LucideArrowDownUp,
    LucideArrowUp,
    LucideChevronLeft,
    LucideChevronRight,
    LucidePencil,
    LucidePlus,
    LucideTrash2,
  ],
  host: { class: 'contents' },
})
export class DataTableComponent<TData extends TableBaseData> {
  public readonly $data = input.required<readonly TData[]>();
  public readonly $totalResults = input<number | undefined>();
  public readonly $columns = input.required<readonly ColDef<TData>[]>();
  public readonly $tableClass = input('');
  public readonly $title = input('Data table');
  public readonly $caption = input('');
  public readonly $emptyMessage = input('No rows to display.');
  public readonly $addActionLabel = input('Add row');
  public readonly $showAddAction = input(true);
  public readonly $showEditAction = input(true);
  public readonly $showDeleteAction = input(true);
  public readonly $striped = input(false);
  public readonly $canEditRow = input<(row: TData) => boolean>(() => true);
  public readonly $canDeleteRow = input<(row: TData) => boolean>(() => true);
  public readonly $defaultSort = input<SortState<TData> | undefined>(undefined);
  public readonly addRequested = output<void>();
  public readonly editRequested = output<TableRowAction<TData>>();
  public readonly deleteRequested = output<TableRowAction<TData>>();

  protected readonly $sortState = linkedSignal(() => this.$defaultSort());
  protected readonly $currentPage = signal(1);
  protected readonly $pageSize = signal<number | 'all'>(10);
  protected readonly $pageSizeOptions: readonly (number | 'all')[] = [
    10,
    25,
    50,
    'all',
  ];
  protected readonly $filteredResults = computed(() => this.$data().length);
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
    const columns = this.$columns();
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
        cells: columns.map((column): RenderTableCell<TData> => {
          const value = row[column.key];
          return {
            column,
            value,
            displayValue: column.valueFormatter
              ? column.valueFormatter(value, row)
              : this.formatDefaultValue(value),
            tooltip: column.tooltip?.(row),
          };
        }),
        canEdit: this.$showEditAction() && this.$canEditRow()(row),
        canDelete: this.$showDeleteAction() && this.$canDeleteRow()(row),
        rowIndex: firstRowIndex + rowIndex,
      }));
  });
  protected readonly $hasRowActions = computed(
    () => this.$showEditAction() || this.$showDeleteAction(),
  );
  protected sort(column: ColDef<TData>): void {
    if (!column.sortable) return;

    const currentState = this.$sortState();
    const nextState: SortState<TData> | undefined =
      currentState?.key !== column.key
        ? { key: column.key, direction: 'asc' }
        : currentState.direction === 'asc'
          ? { key: column.key, direction: 'desc' }
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
    }
  }

  protected requestAdd(): void {
    this.addRequested.emit();
  }

  protected requestEdit(row: RenderTableRow<TData>): void {
    this.editRequested.emit({ index: row.rowIndex, row: row.data });
  }

  protected requestDelete(row: RenderTableRow<TData>): void {
    this.deleteRequested.emit({ index: row.rowIndex, row: row.data });
  }

  private readonly $sortedData = computed(() => {
    const rows = this.$data();
    const sortState = this.$sortState();
    const column = this.$columns().find(
      (candidate) => candidate.key === sortState?.key,
    );
    if (!sortState || !column?.sortable) return rows;

    const direction = sortState.direction === 'asc' ? 1 : -1;
    return [...rows].sort((firstRow, secondRow) => {
      const firstValue =
        column.sortValue?.(firstRow) ?? firstRow[sortState.key];
      const secondValue =
        column.sortValue?.(secondRow) ?? secondRow[sortState.key];
      return this.compareValues(firstValue, secondValue) * direction;
    });
  });

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
}
// #endregion
