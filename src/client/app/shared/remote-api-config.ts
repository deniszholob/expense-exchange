import type { HttpInterceptorFn } from '@angular/common/http';

// #region Constants
export const REMOTE_API_URL_STORAGE_KEY = 'expense-exchange.remote-api-url';
export const REMOTE_API_URL_HISTORY_STORAGE_KEY =
  'expense-exchange.remote-api-url-history';
export const DEFAULT_DEVELOPMENT_API_URL = 'http://localhost:3000';
const MAX_REMOTE_API_URL_HISTORY = 5;
// #endregion

// #region Configuration
export function getDefaultRemoteApiUrl(): string {
  return window.location.port === '4242'
    ? DEFAULT_DEVELOPMENT_API_URL
    : window.location.origin;
}

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
  recordRemoteApiUrl(url);
}

export function getRemoteApiUrlHistory(currentUrl = ''): string[] {
  try {
    const history: unknown = JSON.parse(
      window.localStorage.getItem(REMOTE_API_URL_HISTORY_STORAGE_KEY) ?? '[]',
    );
    if (!Array.isArray(history)) return [];
    const storedUrls = history
      .filter((url: unknown): url is string => typeof url === 'string')
      .map(normalizeRemoteApiUrlForHistory)
      .filter((url): url is string => url !== undefined);
    const normalizedCurrentUrl = normalizeRemoteApiUrlForHistory(currentUrl);
    return [
      ...new Set([
        ...(normalizedCurrentUrl ? [normalizedCurrentUrl] : []),
        ...storedUrls,
      ]),
    ].slice(0, MAX_REMOTE_API_URL_HISTORY);
  } catch {
    return [];
  }
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

// #region Helpers
function recordRemoteApiUrl(url: string): void {
  const normalizedUrl = normalizeRemoteApiUrlForHistory(url);
  if (!normalizedUrl) return;
  const history = getRemoteApiUrlHistory().filter(
    (previousUrl) => previousUrl !== normalizedUrl,
  );
  try {
    window.localStorage.setItem(
      REMOTE_API_URL_HISTORY_STORAGE_KEY,
      JSON.stringify(
        [normalizedUrl, ...history].slice(0, MAX_REMOTE_API_URL_HISTORY),
      ),
    );
  } catch {
    // Keep URL selection usable when browser storage is unavailable.
  }
}

function normalizeRemoteApiUrlForHistory(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url.trim());
    if (
      (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') ||
      parsedUrl.username ||
      parsedUrl.password
    )
      return undefined;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}
// #endregion
