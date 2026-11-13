// #region Imports
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { AuthAccountsStoreSchema } from './auth.schema.js';
import type { AuthAccount } from './auth-account.schema.js';
import {
  isNodeErrorCode,
  readJsonFile,
  readOrCreateSecretFile,
  writeJsonFileAtomically,
} from '../utils/json-file.utils.js';
// #endregion

// #region JSON Adapter
@Injectable()
export class AuthJsonAdapter extends AuthRepository {
  private readonly dataDirectory = process.env['DATA_DIR'] ?? '.dist/data';
  private readonly accountsPath = join(this.dataDirectory, 'accounts.json');
  private readonly secretPath = join(this.dataDirectory, 'session.secret');
  public async readAccounts(): Promise<AuthAccount[]> {
    try {
      return AuthAccountsStoreSchema.parse(
        await readJsonFile(this.accountsPath),
      ).accounts;
    } catch (error: unknown) {
      if (isNodeErrorCode(error, 'ENOENT')) return [];
      throw error;
    }
  }

  public async writeAccounts(accounts: AuthAccount[]): Promise<void> {
    await writeJsonFileAtomically(
      this.accountsPath,
      AuthAccountsStoreSchema.parse({ version: 1, accounts }),
    );
  }

  public async readSessionSecret(): Promise<Buffer> {
    return readOrCreateSecretFile(this.secretPath);
  }
}
// #endregion
