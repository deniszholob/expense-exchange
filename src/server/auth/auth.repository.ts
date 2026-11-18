// #region Imports
import type { AuthAccount } from './auth-account.schema.js';
import type { FilesystemPasswordResetChallenge } from './auth.schema.js';
// #endregion

// #region Repository Contract
export abstract class AuthRepository {
  public abstract readAccounts(): Promise<AuthAccount[]>;
  public abstract writeAccounts(accounts: AuthAccount[]): Promise<void>;
  public abstract readSessionSecret(): Promise<Buffer>;
  public abstract readPasswordResetChallenge(
    accountId: string,
  ): Promise<FilesystemPasswordResetChallenge | undefined>;
  public abstract writePasswordResetChallenge(
    accountId: string,
    challenge: FilesystemPasswordResetChallenge,
  ): Promise<void>;
  public abstract deletePasswordResetChallenge(
    accountId: string,
  ): Promise<void>;
}
// #endregion
