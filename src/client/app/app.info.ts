export const PAGE_ROUTES = {
  //   HOME_PAGE_ROOT: 'home',
  DEV_PAGE_ROOT: 'dev',
  DASHBOARD_PAGE_ROOT: 'dash',
  LOGIN_PAGE_ROOT: 'login',
  PROFILE_PAGE_ROOT: 'profile',
  CONNECTION_PAGE_ROOT: 'data',
  GROUP_PAGE_ROOT: 'group',
  USER_MANAGEMENT_PAGE_ROOT: 'users',
  EXPENSES_PAGE_ROOT: 'expenses',
  SETTINGS_PAGE_ROOT: 'settings',
} as const;

export const ROUTE_KEYWORDS = {
  ROOT: '',
  NEW_ITEM: 'new',
  DETAIL_ITEM: ':id',
  FILTER: '?filter',
} as const;
