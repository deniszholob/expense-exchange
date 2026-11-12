// #region Imports
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PAGE_ROUTES } from '../app.info';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
import { UserRole } from '../../../util/user-role.enum';
// #endregion

// #region Guard
export const UserGuard: CanActivateFn = async (_route, state) => {
  const app = inject(AppService);
  const router = inject(Router);
  await app.authenticationReady;
  if (app.$dataSource() === DataSource.Local) return true;
  const currentUser = app.$currentUser();
  if (currentUser?.role === UserRole.User) return true;
  if (!currentUser) {
    return router.createUrlTree(['/', PAGE_ROUTES.LOGIN_PAGE_ROOT], {
      queryParams: { returnUrl: state.url },
    });
  }
  return router.createUrlTree(['/', PAGE_ROUTES.USER_MANAGEMENT_PAGE_ROOT]);
};
// #endregion
