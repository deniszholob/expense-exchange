// #region Imports
import type { DateRangePreset } from './date-range-preset.enum';
// #endregion

// #region Model
export interface DateRange {
  preset: DateRangePreset;
  year: number | null;
  month: number | null;
  startDate: string;
  endDate: string;
}
// #endregion
