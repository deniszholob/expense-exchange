// #region Imports
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AppService } from '../app.service';
import { DataSource } from '../shared/data-source.enum';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { UserGuard } from './user.guard';
import { appRoutes } from '../app.routes';
import { PageRoute } from '../app.info';
// #endregion

// #region Tests
describe('authentication route guards', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sends unauthenticated remote users to sign in on direct navigation', async () => {
    const appService = {
      authenticationReady: Promise.resolve(),
      $dataSource: signal(DataSource.RemoteApi),
      $currentUser: signal(undefined),
    } as unknown as AppService;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AppService, useValue: appService },
      ],
    });

    const result = await TestBed.runInInjectionContext(() =>
      AuthGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/dash' } as RouterStateSnapshot,
      ),
    );

    expect(result).toBeInstanceOf(UrlTree);
    if (!(result instanceof UrlTree))
      throw new Error('Expected a login redirect');
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('guards every private view, including nested transaction and recurring routes', () => {
    const routesByPath = new Map(appRoutes.map((route) => [route.path, route]));
    const authProtectedRoutes = [
      PageRoute.Dashboard,
      PageRoute.Profile,
      PageRoute.Group,
      PageRoute.Users,
      PageRoute.Transactions,
      PageRoute.Recurring,
    ];

    for (const path of authProtectedRoutes)
      expect(routesByPath.get(path)?.canActivate).toContain(AuthGuard);

    for (const path of [
      PageRoute.Dashboard,
      PageRoute.Group,
      PageRoute.Transactions,
      PageRoute.Recurring,
    ])
      expect(routesByPath.get(path)?.canActivate).toContain(UserGuard);

    expect(routesByPath.get(PageRoute.Users)?.canActivate).toContain(
      AdminGuard,
    );
  });
});
// #endregion
