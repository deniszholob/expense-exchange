// #region Imports
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';

import { provideExpenseExchangeBaseUrl } from 'src/client/api/generated/expense-exchange-api.base-url';
import { appRoutes } from './app.routes';
import { AppTitleService } from './core';
import { remoteApiBaseUrlInterceptor } from './shared/remote-api-config';
import { AuthSessionService } from './shared/auth-session.service';
// #endregion

// #region Configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(
      withInterceptors([
        (request, next) => next(request.clone({ withCredentials: true })),
        (request, next) => {
          const accessToken = inject(AuthSessionService).$accessToken();
          // TODO: Replace protocol detection with a typed Electron preload bridge.
          const isElectron = window.location.protocol === 'file:';
          const isSessionStartRequest = /\/api\/auth\/(setup|login)$/.test(
            request.url,
          );
          const headers: Record<string, string> = {};
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
          if (isElectron && isSessionStartRequest)
            headers['x-expense-exchange-client'] = 'electron';
          return next(
            Object.keys(headers).length > 0
              ? request.clone({ setHeaders: headers })
              : request,
          );
        },
        remoteApiBaseUrlInterceptor,
      ]),
    ),
    provideExpenseExchangeBaseUrl(''),
    provideRouter(
      appRoutes,
      // withEnabledBlockingInitialNavigation(),
      // withInMemoryScrolling({
      //   anchorScrolling: 'enabled',
      //   scrollPositionRestoration: 'enabled',
      // }),
      // withRouterConfig({
      //   onSameUrlNavigation: 'reload',
      // })
    ),
    importProvidersFrom(BrowserModule),
    { provide: Window, useValue: window },
    { provide: TitleStrategy, useClass: AppTitleService },
  ],
};
// #endregion
