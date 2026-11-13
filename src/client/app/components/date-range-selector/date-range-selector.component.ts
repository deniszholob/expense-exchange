// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { DateRangePreset } from '../../shared/date-range/date-range-preset.enum';
import type { DateRange } from '../../shared/date-range/date-range.model';
import {
  createCustomDateRange,
  createDateRangeForSelection,
  formatDateRangeLabel,
  isDateRangeValid,
} from '../../shared/date-range/date-range.util';
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
  selector: 'app-date-range-selector',
  templateUrl: './date-range-selector.component.html',
  host: { class: 'contents' },
  imports: [FormFieldComponent],
})
export class DateRangeSelectorComponent {
  protected readonly DateRangePreset = DateRangePreset;
  protected readonly $monthOptions = MONTH_OPTIONS;
  public readonly $idPrefix = input.required<string>();
  public readonly $earliestExpenseDate = input.required<string | undefined>();
  public readonly $range = model.required<DateRange>();
  protected readonly $yearOptions = computed(() => {
    const currentYear = new Date().getFullYear();
    const earliestDate = this.$earliestExpenseDate();
    const parsedEarliestYear = earliestDate
      ? Number(earliestDate.slice(0, 4))
      : currentYear;
    const earliestYear = Number.isInteger(parsedEarliestYear)
      ? parsedEarliestYear
      : currentYear;
    if (earliestYear > currentYear) return [earliestYear];
    return Array.from(
      { length: currentYear - earliestYear + 1 },
      (_, index) => currentYear - index,
    );
  });
  protected readonly $yearSelection = computed(() => {
    const range = this.$range();
    return range.preset === DateRangePreset.Custom
      ? 'custom'
      : (range.year?.toString() ?? 'all');
  });
  protected readonly $monthSelection = computed(() => {
    const range = this.$range();
    return range.preset === DateRangePreset.Custom
      ? 'custom'
      : (range.month?.toString() ?? 'all');
  });
  protected readonly $rangeLabel = computed(() =>
    formatDateRangeLabel(this.$range()),
  );
  protected readonly $rangeValid = computed(() =>
    isDateRangeValid(this.$range()),
  );

  protected selectYear(event: Event): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement) || select.value === 'custom')
      return;

    const currentRange = this.$range();
    const month =
      currentRange.preset === DateRangePreset.Month ? currentRange.month : null;
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
    if (!(select instanceof HTMLSelectElement) || select.value === 'custom')
      return;

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

  protected updateStartDate(event: Event): void {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      this.updateDate('startDate', input.value);
    }
  }

  protected updateEndDate(event: Event): void {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      this.updateDate('endDate', input.value);
    }
  }

  protected clearStartDate(): void {
    this.updateDate('startDate', '');
  }

  protected clearEndDate(): void {
    this.updateDate('endDate', '');
  }

  private updateDate(field: 'startDate' | 'endDate', value: string): void {
    this.$range.update((range) => {
      return createCustomDateRange(
        field === 'startDate' ? value : range.startDate,
        field === 'endDate' ? value : range.endDate,
      );
    });
  }
}
// #endregion
