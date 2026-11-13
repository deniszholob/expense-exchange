// #region Imports
import { DateRangePreset } from './date-range-preset.enum';
import type { DateRange } from './date-range.model';
// #endregion

// #region Functions
export function createDefaultDataRange(now: Date = new Date()): DateRange {
  return {
    preset: DateRangePreset.AllTime,
    year: null,
    month: now.getMonth() + 1,
    startDate: '',
    endDate: '',
  };
}

export function createDateRangeForPreset(
  preset: DateRangePreset,
  now: Date = new Date(),
): DateRange {
  if (preset === DateRangePreset.Custom) {
    return {
      preset,
      year: null,
      month: null,
      startDate: '',
      endDate: '',
    };
  }
  if (preset === DateRangePreset.AllTime)
    return createDateRangeForSelection(null, null, now);
  if (preset === DateRangePreset.Year)
    return createDateRangeForSelection(now.getFullYear(), null, now);
  return createDateRangeForSelection(
    now.getFullYear(),
    now.getMonth() + 1,
    now,
  );
}

export function createDateRangeForSelection(
  year: number | null,
  month: number | null,
  now: Date = new Date(),
): DateRange {
  const selectedYear = year ?? (month === null ? null : now.getFullYear());
  if (selectedYear === null) {
    return {
      preset: DateRangePreset.AllTime,
      year: null,
      month: null,
      startDate: '',
      endDate: '',
    };
  }

  if (month === null) {
    return {
      preset: DateRangePreset.Year,
      year: selectedYear,
      month: null,
      startDate: formatDate(selectedYear, 0, 1),
      endDate: formatDate(selectedYear, 11, 31),
    };
  }

  return {
    preset: DateRangePreset.Month,
    year: selectedYear,
    month,
    startDate: formatDate(selectedYear, month - 1, 1),
    endDate: formatDate(selectedYear, month, 0),
  };
}

export function createCustomDateRange(
  startDate: string,
  endDate: string,
): DateRange {
  if (!startDate && !endDate)
    return createDateRangeForPreset(DateRangePreset.AllTime);
  return {
    preset: DateRangePreset.Custom,
    year: null,
    month: null,
    startDate,
    endDate,
  };
}

export function isDateWithinRange(date: string, range: DateRange): boolean {
  if (!isDateRangeValid(range)) return false;
  if (range.startDate && date < range.startDate) return false;
  if (range.endDate && date > range.endDate) return false;
  return true;
}

export function isDateRangeValid(range: DateRange): boolean {
  return !range.startDate || !range.endDate || range.startDate <= range.endDate;
}

export function getEarliestDate(dates: readonly string[]): string | undefined {
  let earliestDate: string | undefined;
  for (const date of dates) {
    if (date && (!earliestDate || date < earliestDate)) earliestDate = date;
  }
  return earliestDate;
}

export function formatDataRangeLabel(range: DateRange): string {
  if (range.preset === DateRangePreset.AllTime) return 'All time';
  if (range.preset === DateRangePreset.Month && range.startDate) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${range.startDate}T00:00:00`));
  }
  if (range.preset === DateRangePreset.Year && range.startDate) {
    return range.startDate.slice(0, 4);
  }
  if (!range.startDate && !range.endDate) return 'Custom range';
  if (!range.startDate) return `Through ${formatDateLabel(range.endDate)}`;
  if (!range.endDate) return `From ${formatDateLabel(range.startDate)}`;
  return `${formatDateLabel(range.startDate)} – ${formatDateLabel(range.endDate)}`;
}

function formatDate(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: string): string {
  if (!date) return 'any date';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    parsed,
  );
}
// #endregion
