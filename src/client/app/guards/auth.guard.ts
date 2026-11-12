// #region Imports
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PAGE_ROUTES } from '../app.info';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
// #endregion

// #region Guard
export const AuthGuard: CanActivateFn = async (_route, state) => {
  const app = inject(AppService);
  const router = inject(Router);
  await app.authenticationReady;
  if (app.$dataSource() === DataSource.Local || app.$currentUser()) return true;
  return router.createUrlTree(['/', PAGE_ROUTES.LOGIN_PAGE_ROOT], {
    queryParams: { returnUrl: state.url },
  });
};
// #endregion
