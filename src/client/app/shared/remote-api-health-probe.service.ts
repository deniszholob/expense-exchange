import { HttpClient, HttpBackend } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { getConfiguredRemoteApiUrl } from './remote-api-config';

// #region Constants
const HEALTH_CHECK_TIMEOUT_MS = 6000;
// #endregion

// #region Service
@Injectable({ providedIn: 'root' })
export class RemoteApiHealthProbeService {
  private readonly http = new HttpClient(inject(HttpBackend));

  public async check(url: string): Promise<void> {
    const baseUrl = url.trim() || getConfiguredRemoteApiUrl();
    const targetUrl = baseUrl
      ? new URL('/api/health', baseUrl).toString()
      : new URL('/api/health', window.location.origin).toString();

    await firstValueFrom(
      this.http
        .get<{ status: string }>(targetUrl)
        .pipe(timeout({ first: HEALTH_CHECK_TIMEOUT_MS })),
    );
  }
}
// #endregion
