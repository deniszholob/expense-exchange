// #region Session Form Draft Storage
const SESSION_FORM_DRAFT_PREFIX = 'expense-exchange.form-draft';

export function getSessionFormDraftKey(...segments: string[]): string {
  return `${SESSION_FORM_DRAFT_PREFIX}:${segments.map(encodeURIComponent).join(':')}`;
}

export function readSessionFormDraft<T>(
  key: string,
  isValue: (value: unknown) => value is T,
): T | undefined {
  try {
    const serialized = window.sessionStorage.getItem(key);
    if (!serialized) return undefined;
    const value: unknown = JSON.parse(serialized);
    return isValue(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function saveSessionFormDraft<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the form usable when session storage is unavailable.
  }
}

export function removeSessionFormDraft(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Keep the form usable when session storage is unavailable.
  }
}
// #endregion
