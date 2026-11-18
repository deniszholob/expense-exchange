// #region Imports
import { createHash } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import {
  AuthAccountsStoreSchema,
  FilesystemPasswordResetChallengeSchema,
} from './auth.schema.js';
import type { AuthAccount } from './auth-account.schema.js';
import type { FilesystemPasswordResetChallenge } from './auth.schema.js';
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
  private readonly passwordResetDirectory = join(
    this.dataDirectory,
    'password-reset-requests',
  );
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

  public async readPasswordResetChallenge(
    accountId: string,
  ): Promise<FilesystemPasswordResetChallenge | undefined> {
    try {
      return FilesystemPasswordResetChallengeSchema.parse(
        await readJsonFile(this.passwordResetChallengePath(accountId)),
      );
    } catch (error: unknown) {
      if (isNodeErrorCode(error, 'ENOENT')) return undefined;
      throw error;
    }
  }

  public async writePasswordResetChallenge(
    accountId: string,
    challenge: FilesystemPasswordResetChallenge,
  ): Promise<void> {
    await writeJsonFileAtomically(
      this.passwordResetChallengePath(accountId),
      FilesystemPasswordResetChallengeSchema.parse(challenge),
    );
  }

  public async deletePasswordResetChallenge(accountId: string): Promise<void> {
    try {
      await unlink(this.passwordResetChallengePath(accountId));
    } catch (error: unknown) {
      if (!isNodeErrorCode(error, 'ENOENT')) throw error;
    }
  }

  private passwordResetChallengePath(accountId: string): string {
    const fileKey = createHash('sha256').update(accountId).digest('hex');
    return join(this.passwordResetDirectory, `password-reset-${fileKey}.txt`);
  }
}
// #endregion
