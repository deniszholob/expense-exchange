export const PAGE_ROUTES = {
  //   HOME_PAGE_ROOT: 'home',
  DEV_PAGE_ROOT: 'dev',
  DASHBOARD_PAGE_ROOT: 'dash',
  USERS_PAGE_ROOT: 'users',
  EXPENSES_PAGE_ROOT: 'expenses',
} as const;

export const ROUTE_KEYWORDS = {
  ROOT: '',
  NEW_ITEM: 'new',
  DETAIL_ITEM: ':id',
  FILTER: '?filter',
} as const;
