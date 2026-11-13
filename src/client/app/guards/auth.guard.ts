// #region Imports
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { CanActivateFn } from '@angular/router';
import { PageRoute } from '../app.info';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
// #endregion

// #region Guard
export const AuthGuard: CanActivateFn = async () => {
  const app = inject(AppService);
  const router = inject(Router);
  await app.authenticationReady;
  if (app.$dataSource() === DataSource.Local || app.$currentUser()) return true;
  return router.createUrlTree(['/', PageRoute.Login]);
};
// #endregion
