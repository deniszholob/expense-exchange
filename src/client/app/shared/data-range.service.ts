// #region Imports
import { Injectable, effect, signal } from '@angular/core';
import { DateRangePreset } from './date-range/date-range-preset.enum';
import type { DateRange } from './date-range/date-range.model';
import { createDefaultDataRange } from './date-range/date-range.util';
// #endregion

// #region Constants
const DATA_RANGE_STORAGE_KEY = 'expense-exchange.date-range';
// #endregion

// #region Service
@Injectable({ providedIn: 'root' })
export class DataRangeService {
  public readonly $dataRange = signal(readSavedDataRange());

  public constructor() {
    effect(() => {
      try {
        window.localStorage.setItem(
          DATA_RANGE_STORAGE_KEY,
          JSON.stringify(this.$dataRange()),
        );
      } catch {
        // Keep the selected range available for this session if storage fails.
      }
    });
  }
}
// #endregion

// #region Helpers
function readSavedDataRange(): DateRange {
  try {
    const serialized = window.localStorage.getItem(DATA_RANGE_STORAGE_KEY);
    if (serialized) {
      const value: unknown = JSON.parse(serialized);
      if (isDataRange(value)) return value;
    }
  } catch {
    // Fall back to the default range when storage is unavailable or invalid.
  }
  return createDefaultDataRange();
}

function isDataRange(value: unknown): value is DateRange {
  if (!isRecord(value)) return false;
  const candidate = value;
  return (
    Object.values(DateRangePreset).some(
      (preset) => preset === candidate['preset'],
    ) &&
    (candidate['year'] === null ||
      (typeof candidate['year'] === 'number' &&
        Number.isInteger(candidate['year']))) &&
    (candidate['month'] === null ||
      (typeof candidate['month'] === 'number' &&
        Number.isInteger(candidate['month']) &&
        candidate['month'] >= 1 &&
        candidate['month'] <= 12)) &&
    typeof candidate['startDate'] === 'string' &&
    typeof candidate['endDate'] === 'string' &&
    (!candidate['startDate'] ||
      !candidate['endDate'] ||
      candidate['startDate'] <= candidate['endDate'])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion
