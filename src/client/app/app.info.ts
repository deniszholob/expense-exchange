// #region Imports
import {
  LucideChartNoAxesCombined,
  LucideCodeXml,
  LucideDatabase,
  LucideLogIn,
  LucideReceipt,
  LucideSettings,
  LucideUserRound,
  LucideUsersRound,
} from '@lucide/angular';
import type { LucideIcon } from '@lucide/angular';
// #endregion

// #region Route Definitions
export enum PageRoute {
  Dev = 'dev',
  Dashboard = 'dash',
  Login = 'login',
  Profile = 'profile',
  Data = 'data',
  Group = 'group',
  Users = 'users',
  Transactions = 'transactions',
  Settings = 'settings',
}

export interface PageRouteInfo {
  readonly id: PageRoute;
  readonly display: string;
  readonly icon: LucideIcon;
  readonly utilityOrder?: number;
}

export const PAGE_ROUTE_INFO: Record<PageRoute, PageRouteInfo> = {
  [PageRoute.Dev]: {
    id: PageRoute.Dev,
    display: 'Dev',
    icon: LucideCodeXml,
    utilityOrder: 11,
  },
  [PageRoute.Dashboard]: {
    id: PageRoute.Dashboard,
    display: 'Dash',
    icon: LucideChartNoAxesCombined,
  },
  [PageRoute.Login]: {
    id: PageRoute.Login,
    display: 'Login',
    icon: LucideLogIn,
  },
  [PageRoute.Profile]: {
    id: PageRoute.Profile,
    display: 'Profile',
    icon: LucideUserRound,
  },
  [PageRoute.Data]: {
    id: PageRoute.Data,
    display: 'Data',
    icon: LucideDatabase,
    utilityOrder: 10,
  },
  [PageRoute.Group]: {
    id: PageRoute.Group,
    display: 'Group',
    icon: LucideUsersRound,
  },
  [PageRoute.Users]: {
    id: PageRoute.Users,
    display: 'Users',
    icon: LucideUsersRound,
  },
  [PageRoute.Transactions]: {
    id: PageRoute.Transactions,
    display: 'Transactions',
    icon: LucideReceipt,
  },
  [PageRoute.Settings]: {
    id: PageRoute.Settings,
    display: 'Settings',
    icon: LucideSettings,
  },
} as const;

export const PAGE_ROUTE_INFO_OPTIONS: PageRouteInfo[] = Object.values(
  PageRoute,
).map((route: PageRoute): PageRouteInfo => PAGE_ROUTE_INFO[route]);

export function isPageRoute(value: string): value is PageRoute {
  return PAGE_ROUTE_INFO_OPTIONS.some((route) => route.id === value);
}

export function getPageRouteInfo(value: string): PageRouteInfo | undefined {
  return isPageRoute(value) ? PAGE_ROUTE_INFO[value] : undefined;
}

export const ROUTE_KEYWORDS = {
  ROOT: '',
  NEW_ITEM: 'new',
  DETAIL_ITEM: ':id',
  FILTER: '?filter',
} as const;
// #endregion
