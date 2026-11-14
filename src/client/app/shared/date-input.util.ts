// #region Date Input Utilities
export function normalizeDateInput(value: string): string | undefined {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const slashIsoMatch = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value);
  const localizedMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const match = isoMatch ?? slashIsoMatch ?? localizedMatch;
  if (!match) return undefined;

  const yearPart = isoMatch || slashIsoMatch ? match[1] : match[3];
  const monthPart = isoMatch || slashIsoMatch ? match[2] : match[1];
  const dayPart = isoMatch || slashIsoMatch ? match[3] : match[2];
  if (!yearPart || !monthPart || !dayPart) return undefined;

  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  )
    return undefined;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatDateInputForDisplay(value: string): string {
  const normalized = normalizeDateInput(value);
  return normalized ? normalized.replaceAll('-', '/') : value;
}
// #endregion
