import { isDevMode } from '@angular/core';
import { Route } from '@angular/router';

import { PAGE_ROUTES, ROUTE_KEYWORDS } from './app.info';
import {
  DashboardPageComponent,
  ExpensesPageComponent,
  UsersPageComponent,
} from './pages';

const DEV_ROUTE: Route[] = [];
// https://angular.dev/api/core/isDevMode?tab=description
if (isDevMode()) {
  DEV_ROUTE.push({
    path: PAGE_ROUTES.DEV_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/dev-page/dev-page.component').then(
        (m) => m.DevPageComponent,
      ),
  });
}

export const appRoutes: Route[] = [
  { path: '', redirectTo: PAGE_ROUTES.DASHBOARD_PAGE_ROOT, pathMatch: 'full' },
  // { path: HOME_PAGE_ROOT, component: ViewPages.HomePageComponent },
  // { path: 'home', redirectTo: HOME_PAGE_ROOT, pathMatch: 'full' },
  // ======================================================================== //
  { path: PAGE_ROUTES.DASHBOARD_PAGE_ROOT, component: DashboardPageComponent },
  { path: PAGE_ROUTES.USERS_PAGE_ROOT, component: UsersPageComponent },
  {
    path: PAGE_ROUTES.EXPENSES_PAGE_ROOT,
    children: [
      { path: ROUTE_KEYWORDS.ROOT, component: ExpensesPageComponent },
      {
        path: ROUTE_KEYWORDS.DETAIL_ITEM,
        component: ExpensesPageComponent,
      },
    ],
  },
  ...DEV_ROUTE,
  // ======================================================================== //
  // { path: '**', redirectTo: '', pathMatch: 'full' },
  //   { path: '**', component: ViewPages.NotFoundComponent },
];
