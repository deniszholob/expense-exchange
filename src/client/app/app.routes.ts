// #region Imports
import { inject, isDevMode } from '@angular/core';
import type { RedirectFunction, Route } from '@angular/router';
import { PageRoute, ROUTE_KEYWORDS } from './app.info';
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
  if (!appService.$dataSourceConfigured()) return `/${PageRoute.Data}`;
  if (appService.$dataSource() === DataSource.Local)
    return `/${PageRoute.Dashboard}`;
  return `/${PageRoute.Login}`;
};
// https://angular.dev/api/core/isDevMode?tab=description
if (isDevMode()) {
  DEV_ROUTE.push({
    path: PageRoute.Dev,
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
    path: PageRoute.Login,
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then(
        (module) => module.LoginPageComponent,
      ),
  },
  {
    path: PageRoute.Profile,
    loadComponent: () =>
      import('./pages/profile-page/profile-page.component').then(
        (module) => module.ProfilePageComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: PageRoute.Data,
    loadComponent: () =>
      import('./pages/connection-page/connection-page.component').then(
        (module) => module.ConnectionPageComponent,
      ),
  },
  {
    path: PageRoute.Settings,
    redirectTo: PageRoute.Data,
    pathMatch: 'full',
  },
  {
    path: PageRoute.Dashboard,
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent,
      ),
    canActivate: [AuthGuard, UserGuard],
  },
  {
    path: PageRoute.Group,
    loadComponent: () =>
      import('./pages/group-page/group-page.component').then(
        (module) => module.GroupPageComponent,
      ),
    canActivate: [AuthGuard, UserGuard],
  },
  {
    path: PageRoute.Users,
    loadComponent: () =>
      import('./pages/user-management-page/user-management-page.component').then(
        (module) => module.UserManagementPageComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: PageRoute.Transactions,
    children: [
      {
        path: ROUTE_KEYWORDS.ROOT,
        loadComponent: () =>
          import('./pages/transactions-page/transactions-page.component').then(
            (module) => module.TransactionsPageComponent,
          ),
      },
      {
        path: ROUTE_KEYWORDS.DETAIL_ITEM,
        loadComponent: () =>
          import('./pages/transactions-page/transactions-page.component').then(
            (module) => module.TransactionsPageComponent,
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
