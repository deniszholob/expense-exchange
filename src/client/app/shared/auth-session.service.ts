// #region Imports
import { Injectable, signal } from '@angular/core';
// #endregion

// #region Session State
@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  public readonly $accessToken = signal<string | undefined>(undefined);

  public setAccessToken(token: string | undefined): void {
    this.$accessToken.set(token);
  }
}
// #endregion
