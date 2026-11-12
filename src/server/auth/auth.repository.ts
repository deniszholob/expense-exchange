// #region Imports
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { UserRole } from '../../util/user-role.enum.js';
// #endregion

// #region Contracts
export interface AuthAccount {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  passwordHash: string;
}

export abstract class AuthRepository {
  public abstract readAccounts(): Promise<AuthAccount[]>;
  public abstract writeAccounts(accounts: AuthAccount[]): Promise<void>;
  public abstract readSessionSecret(): Promise<Buffer>;
}

const AccountsSchema = z.object({
  version: z.literal(1),
  accounts: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      username: z.string().min(3),
      role: z.enum(UserRole),
      passwordHash: z.string().min(1),
    }),
  ),
});
// #endregion

// #region JSON Adapter
@Injectable()
export class JsonAuthRepository extends AuthRepository {
  private readonly dataDirectory = process.env['DATA_DIR'] ?? '.dist/data';
  private readonly accountsPath = join(this.dataDirectory, 'accounts.json');
  private readonly secretPath = join(this.dataDirectory, 'session.secret');
  public async readAccounts(): Promise<AuthAccount[]> {
    await mkdir(this.dataDirectory, { recursive: true });
    try {
      const serialized = await readFile(this.accountsPath, 'utf8');
      return AccountsSchema.parse(JSON.parse(serialized)).accounts;
    } catch (error: unknown) {
      if (isMissingFile(error)) return [];
      throw error;
    }
  }

  public async writeAccounts(accounts: AuthAccount[]): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true });
    const temporary = `${this.accountsPath}.${randomBytes(8).toString('hex')}.tmp`;
    await writeFile(
      temporary,
      `${JSON.stringify({ version: 1, accounts }, null, 2)}\n`,
      { mode: 0o600 },
    );
    await rename(temporary, this.accountsPath);
  }

  public async readSessionSecret(): Promise<Buffer> {
    await mkdir(this.dataDirectory, { recursive: true });
    try {
      return await readFile(this.secretPath);
    } catch (error: unknown) {
      if (!isMissingFile(error)) throw error;
      const secret = randomBytes(48);
      try {
        await writeFile(this.secretPath, secret, { flag: 'wx', mode: 0o600 });
        return secret;
      } catch (writeError: unknown) {
        if (!isAlreadyExists(writeError)) throw writeError;
        return readFile(this.secretPath);
      }
    }
  }
}
// #endregion

// #region Helpers
function isMissingFile(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
function isAlreadyExists(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'EEXIST'
  );
}
// #endregion
