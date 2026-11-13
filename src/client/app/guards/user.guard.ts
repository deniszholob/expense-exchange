// #region Imports
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { PageRoute } from '../app.info';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
import { UserRole } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region Guard
export const UserGuard: CanActivateFn = async () => {
  const app = inject(AppService);
  const router = inject(Router);
  await app.authenticationReady;
  if (app.$dataSource() === DataSource.Local) return true;
  const currentUser = app.$currentUser();
  if (currentUser?.role === UserRole.User) return true;
  if (!currentUser) {
    return router.createUrlTree(['/', PageRoute.Login]);
  }
  return router.createUrlTree(['/', PageRoute.Users]);
};
// #endregion
