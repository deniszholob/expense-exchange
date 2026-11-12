// #region Imports
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
import { UserRole } from '../../../util/user-role.enum';
import { PAGE_ROUTES } from '../app.info';
// #endregion

// #region Guard
export const AdminGuard: CanActivateFn = async () => {
  const app = inject(AppService);
  const router = inject(Router);
  await app.authenticationReady;
  if (app.$dataSource() === DataSource.Local) return true;
  const currentUser = app.$currentUser();
  if (currentUser?.role === UserRole.Admin) return true;
  if (!currentUser)
    return router.createUrlTree(['/', PAGE_ROUTES.LOGIN_PAGE_ROOT]);
  return router.createUrlTree(['/', PAGE_ROUTES.DASHBOARD_PAGE_ROOT]);
};
// #endregion
