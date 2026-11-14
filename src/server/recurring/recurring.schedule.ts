// #region Imports
import { RecurrenceCadence } from './recurring.schema.js';
// #endregion

// #region Schedule Utilities
export function addDaysToDate(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDate(value);
}

export function addCadenceToDate(
  date: string,
  cadence: RecurrenceCadence,
  anchorDate: string,
): string {
  const cadenceDays: Partial<Record<RecurrenceCadence, number>> = {
    [RecurrenceCadence.Weekly]: 7,
    [RecurrenceCadence.Biweekly]: 14,
  };
  const days = cadenceDays[cadence];
  if (days) return addDaysToDate(date, days);

  const monthIntervals: Record<RecurrenceCadence, number> = {
    [RecurrenceCadence.Weekly]: 0,
    [RecurrenceCadence.Biweekly]: 0,
    [RecurrenceCadence.Monthly]: 1,
    [RecurrenceCadence.Biannual]: 6,
    [RecurrenceCadence.Yearly]: 12,
  };
  const currentDate = parseDate(date);
  const anchorDay = parseDate(anchorDate).getUTCDate();
  const targetMonthIndex =
    currentDate.getUTCFullYear() * 12 +
    currentDate.getUTCMonth() +
    monthIntervals[cadence];
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = targetMonthIndex % 12;
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  return formatDate(
    new Date(Date.UTC(targetYear, targetMonth, Math.min(anchorDay, lastDay))),
  );
}

export function getNextCadenceDateAfter(
  startDate: string,
  cadence: RecurrenceCadence,
  afterDate: string,
): string {
  let nextDate = startDate;
  while (nextDate <= afterDate)
    nextDate = addCadenceToDate(nextDate, cadence, startDate);
  return nextDate;
}

// #endregion

// #region Helpers
function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
// #endregion
