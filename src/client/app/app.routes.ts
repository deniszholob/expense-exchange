// #region Imports
import { inject, isDevMode } from '@angular/core';
import type { RedirectFunction, Route } from '@angular/router';
import { PAGE_ROUTES, ROUTE_KEYWORDS } from './app.info';
import { AppService } from './app.service';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { UserGuard } from './guards/user.guard';
import { DataSource } from './shared/data-source.enum';
// #endregion

// #region Routes
const DEV_ROUTE: Route[] = [];
const redirectToStartupPage: RedirectFunction = () => {
  const appService = inject(AppService);
  if (!appService.$dataSourceConfigured())
    return `/${PAGE_ROUTES.CONNECTION_PAGE_ROOT}`;
  if (appService.$dataSource() === DataSource.Local)
    return `/${PAGE_ROUTES.DASHBOARD_PAGE_ROOT}`;
  return `/${PAGE_ROUTES.LOGIN_PAGE_ROOT}`;
};
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
  { path: '', redirectTo: redirectToStartupPage, pathMatch: 'full' },
  // { path: HOME_PAGE_ROOT, component: ViewPages.HomePageComponent },
  // { path: 'home', redirectTo: HOME_PAGE_ROOT, pathMatch: 'full' },
  // ======================================================================== //
  {
    path: PAGE_ROUTES.LOGIN_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: PAGE_ROUTES.PROFILE_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(
        (module) => module.ProfilePageComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: PAGE_ROUTES.CONNECTION_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/connection-page/connection-page.component').then(
        (module) => module.ConnectionPageComponent,
      ),
  },
  {
    path: PAGE_ROUTES.SETTINGS_PAGE_ROOT,
    redirectTo: PAGE_ROUTES.CONNECTION_PAGE_ROOT,
    pathMatch: 'full',
  },
  {
    path: PAGE_ROUTES.DASHBOARD_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent,
      ),
    canActivate: [AuthGuard, UserGuard],
  },
  {
    path: PAGE_ROUTES.GROUP_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/group-page/group-page.component').then(
        (module) => module.GroupPageComponent,
      ),
    canActivate: [AuthGuard, UserGuard],
  },
  {
    path: PAGE_ROUTES.USER_MANAGEMENT_PAGE_ROOT,
    loadComponent: () =>
      import('./pages/user-management-page/user-management-page.component').then(
        (module) => module.UserManagementPageComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: PAGE_ROUTES.EXPENSES_PAGE_ROOT,
    children: [
      {
        path: ROUTE_KEYWORDS.ROOT,
        loadComponent: () =>
          import('./pages/expenses-page/expenses-page.component').then(
            (module) => module.ExpensesPageComponent,
          ),
      },
      {
        path: ROUTE_KEYWORDS.DETAIL_ITEM,
        loadComponent: () =>
          import('./pages/expenses-page/expenses-page.component').then(
            (module) => module.ExpensesPageComponent,
          ),
      },
    ],
    canActivate: [AuthGuard, UserGuard],
  },
  ...DEV_ROUTE,
  // ======================================================================== //
  // { path: '**', redirectTo: '', pathMatch: 'full' },
  //   { path: '**', component: ViewPages.NotFoundComponent },
];
// #endregion
