// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { DateRangePreset } from 'src/client/app/shared/date-range/date-range-preset.enum';
import type { DateRange } from 'src/client/app/shared/date-range/date-range.model';
import {
  createCustomDateRange,
  createDateRangeForSelection,
  formatDataRangeLabel,
  isDateRangeValid,
} from 'src/client/app/shared/date-range/date-range.util';
import { DateInputComponent } from '../forms/date-input/date-input.component';
// #endregion

// #region Constants
const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-range-panel',
  templateUrl: './data-range-panel.component.html',
  host: { class: 'contents' },
  imports: [FormFieldComponent, DateInputComponent],
})
export class DataRangePanelComponent {
  public readonly $range = model.required<DateRange>();
  public readonly $earliestDate = input<string>();
  public readonly $idPrefix = input('data-range');
  public readonly $panelId = input('global-data-range-panel');

  protected readonly $monthOptions = MONTH_OPTIONS;
  protected readonly $currentYearLabel = new Date().getFullYear().toString();
  protected readonly $currentMonthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
  }).format(new Date());
  protected readonly $yearOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const earliestDate = this.$earliestDate();
    const parsedEarliestYear = earliestDate
      ? Number(earliestDate.slice(0, 4))
      : currentYear;
    const earliestYear = Number.isInteger(parsedEarliestYear)
      ? parsedEarliestYear
      : currentYear;
    const years =
      earliestYear > currentYear
        ? [earliestYear]
        : Array.from(
            { length: currentYear - earliestYear + 1 },
            (_, index) => currentYear - index,
          );
    const range = this.$range();
    const rangeYears = [
      range.year,
      range.startDate ? Number(range.startDate.slice(0, 4)) : null,
      range.endDate ? Number(range.endDate.slice(0, 4)) : null,
    ].filter((year): year is number => year !== null && Number.isInteger(year));
    return [...new Set([...years, currentYear, ...rangeYears])].sort(
      (firstYear, secondYear) => secondYear - firstYear,
    );
  });
  protected readonly $yearSelection = computed(() => {
    const range = this.$range();
    if (range.year !== null) return range.year.toString();
    const startYear = range.startDate.slice(0, 4);
    const endYear = range.endDate.slice(0, 4);
    return startYear && (!endYear || startYear === endYear)
      ? startYear
      : endYear && !startYear
        ? endYear
        : 'all';
  });
  protected readonly $monthSelection = computed(() => {
    const range = this.$range();
    const startMonth = range.startDate.slice(5, 7);
    const endMonth = range.endDate.slice(5, 7);
    const startYear = range.startDate.slice(0, 4);
    const endYear = range.endDate.slice(0, 4);
    const selectedMonth = startMonth || endMonth;
    return selectedMonth &&
      (!startMonth || !endMonth || startMonth === endMonth) &&
      (!startYear || !endYear || startYear === endYear)
      ? String(Number(selectedMonth))
      : 'all';
  });
  protected readonly $rangeLabel = computed(() =>
    formatDataRangeLabel(this.$range()),
  );
  protected readonly $rangeValid = computed(() =>
    isDateRangeValid(this.$range()),
  );

  protected selectYear(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    const currentRange = this.$range();
    const month = currentRange.month;
    if (select.value === 'all') {
      const year = month === null ? null : new Date().getFullYear();
      this.$range.set(createDateRangeForSelection(year, month));
      return;
    }

    const year = Number(select.value);
    if (!Number.isInteger(year)) return;
    this.$range.set(createDateRangeForSelection(year, month));
  }

  protected selectMonth(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) return;

    const currentRange = this.$range();
    if (select.value === 'all') {
      const year =
        currentRange.preset === DateRangePreset.Custom
          ? null
          : currentRange.year;
      this.$range.set(createDateRangeForSelection(year, null));
      return;
    }

    const month = Number(select.value);
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    this.$range.set(createDateRangeForSelection(currentRange.year, month));
  }

  protected selectAllTime(): void {
    this.$range.set(createDateRangeForSelection(null, null));
  }

  protected selectCurrentYear(): void {
    const year = new Date().getFullYear();
    this.$range.set({
      ...createDateRangeForSelection(year, null),
      preset: DateRangePreset.Year,
      year,
    });
  }

  protected selectCurrentMonth(): void {
    const now = new Date();
    this.$range.set(
      createDateRangeForSelection(now.getFullYear(), now.getMonth() + 1, now),
    );
  }

  protected updateStartDateValue(value: string): void {
    this.updateDate('startDate', value);
  }

  protected updateEndDateValue(value: string): void {
    this.updateDate('endDate', value);
  }

  protected clearStartDate(): void {
    this.updateDate('startDate', '');
  }

  protected clearEndDate(): void {
    this.updateDate('endDate', '');
  }

  private updateDate(field: 'startDate' | 'endDate', value: string): void {
    this.$range.update((range) =>
      createCustomDateRange(
        field === 'startDate' ? value : range.startDate,
        field === 'endDate' ? value : range.endDate,
      ),
    );
  }
}
// #endregion
