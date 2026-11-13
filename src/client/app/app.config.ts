// #region Imports
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';

import { provideExpenseExchangeBaseUrl } from 'src/client/api/generated/expense-exchange-api.base-url';
import { appRoutes } from './app.routes';
import { AppTitleService } from './core';
import { remoteApiBaseUrlInterceptor } from './shared/remote-api-config';
// #endregion

// #region Configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(
      withInterceptors([
        (request, next) => next(request.clone({ withCredentials: true })),
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
