// #region Constants
export const LAST_PAGE_SESSION_KEY = 'expense-exchange.last-page';

const REMEMBERED_PAGE_ROOTS = new Set([
  'dash',
  'data',
  'expenses',
  'group',
  'users',
]);
// #endregion

// #region Helpers
export function isRememberedPageUrl(url: string): boolean {
  const pathname = url.split(/[?#]/, 1)[0] ?? '';
  const [, root] = pathname.split('/');
  return root !== undefined && REMEMBERED_PAGE_ROOTS.has(root);
}

export function readLastPageUrl(): string | undefined {
  try {
    const lastPage = window.sessionStorage.getItem(LAST_PAGE_SESSION_KEY);
    return lastPage && isRememberedPageUrl(lastPage) ? lastPage : undefined;
  } catch {
    return undefined;
  }
}
// #endregion
