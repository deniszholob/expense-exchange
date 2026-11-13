// #region Imports
import type { AuthAccount } from './auth-account.schema.js';
// #endregion

// #region Repository Contract
export abstract class AuthRepository {
  public abstract readAccounts(): Promise<AuthAccount[]>;
  public abstract writeAccounts(accounts: AuthAccount[]): Promise<void>;
  public abstract readSessionSecret(): Promise<Buffer>;
}
// #endregion
