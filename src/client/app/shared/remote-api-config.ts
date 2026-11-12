import type { HttpInterceptorFn } from '@angular/common/http';

// #region Constants
export const REMOTE_API_URL_STORAGE_KEY = 'expense-exchange.remote-api-url';
export const DEFAULT_DEVELOPMENT_API_URL = 'http://localhost:3000';
// #endregion

// #region Configuration
export function getConfiguredRemoteApiUrl(): string {
  const developmentDefault =
    window.location.port === '4242' ? DEFAULT_DEVELOPMENT_API_URL : '';

  try {
    const configuredUrl = window.localStorage.getItem(
      REMOTE_API_URL_STORAGE_KEY,
    );
    return configuredUrl?.trim() || developmentDefault;
  } catch {
    return developmentDefault;
  }
}

export function saveConfiguredRemoteApiUrl(url: string): void {
  window.localStorage.setItem(REMOTE_API_URL_STORAGE_KEY, url.trim());
}

export const remoteApiBaseUrlInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const requestUrl = new URL(request.url, window.location.origin);
  if (!requestUrl.pathname.startsWith('/api/')) return next(request);

  const configuredUrl = getConfiguredRemoteApiUrl();
  if (!configuredUrl) {
    return next(
      request.clone({
        url: `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
      }),
    );
  }

  try {
    const baseUrl = new URL(configuredUrl);
    if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
      throw new Error('Remote API URL must use HTTP or HTTPS.');
    }
    const targetUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
      baseUrl,
    );
    return next(request.clone({ url: targetUrl.toString() }));
  } catch {
    return next(
      request.clone({
        url: `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
      }),
    );
  }
};
// #endregion
