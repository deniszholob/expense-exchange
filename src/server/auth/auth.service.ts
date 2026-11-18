// #region Imports
import {
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { GroupMemberRepository } from '../group-member/group-member.repository.js';
import { AuthRepository } from './auth.repository.js';
import type { AuthAccount } from './auth-account.schema.js';
import type {
  AuthUser,
  AuthStatus,
  FilesystemPasswordResetComplete,
  LoginAccount,
} from './auth.schema.js';
import { PASSWORD_RESET_LIFETIME_MINUTES } from './auth.schema.js';
import { UserRole } from './user-role.enum.js';
import { UserColor } from './user-color.enum.js';
import { SESSION_LIFETIME_MS } from './auth-session.constants.js';
// #endregion

// #region Types and Constants
const PASSWORD_RESET_RANDOM_BYTES = 16;
const PASSWORD_RESET_LIFETIME_MS = PASSWORD_RESET_LIFETIME_MINUTES * 60 * 1000;

interface AccountsStore {
  accounts: AuthAccount[];
}
// #endregion

// #region Authentication Service
@Injectable()
export class AuthService {
  private accountWriteQueue: Promise<void> = Promise.resolve();
  public constructor(
    private readonly repository: AuthRepository,
    private readonly groupMembers: GroupMemberRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async status(): Promise<AuthStatus> {
    return { setupRequired: (await this.readAccounts()).accounts.length === 0 };
  }

  public setup(
    name: string | undefined,
    username: string,
    password: string,
  ): Promise<AuthUser> {
    return this.updateAccounts(async (store) => {
      if (store.accounts.length > 0)
        throw new ConflictException(
          'Initial administrator is already configured',
        );
      const resolvedName = name?.trim() || normalizeUsername(username);
      const account: AuthAccount = {
        id: randomUUID(),
        name: resolvedName,
        username: normalizeUsername(username),
        role: UserRole.Admin,
        color: UserColor.Gray,
        passwordHash: await this.passwordHasher.hash(password),
        sessionVersion: 0,
      };
      store.accounts.push(account);
      return publicUser(account);
    });
  }

  public async listAccounts(): Promise<AuthUser[]> {
    return (await this.readAccounts()).accounts.map(publicUser);
  }

  public async listLoginAccounts(): Promise<LoginAccount[]> {
    return (await this.readAccounts()).accounts.map((account) => ({
      username: account.username,
      role: account.role,
      color: account.role === UserRole.Admin ? UserColor.Gray : account.color,
    }));
  }

  public async getAccount(id: string): Promise<AuthUser> {
    const account = (await this.readAccounts()).accounts.find(
      (entry) => entry.id === id,
    );
    if (!account) throw new ConflictException('Account does not exist');
    return publicUser(account);
  }

  public createAccount(
    name: string | undefined,
    username: string,
    password: string,
  ): Promise<AuthUser> {
    return this.updateAccounts(async (store) => {
      const normalizedUsername = normalizeUsername(username);
      if (
        store.accounts.some(
          (account) => account.username === normalizedUsername,
        )
      )
        throw new ConflictException('Username is already in use');
      const account: AuthAccount = {
        id: randomUUID(),
        name: name?.trim() || normalizedUsername,
        username: normalizedUsername,
        role: UserRole.User,
        color: getNextUserColor(store.accounts),
        passwordHash: await this.passwordHasher.hash(password),
        sessionVersion: 0,
      };
      store.accounts.push(account);
      return publicUser(account);
    });
  }

  public updateManagedAccount(
    id: string,
    input: { name?: string; username?: string; password?: string },
  ): Promise<AuthUser> {
    return this.updateAccounts(async (store) => {
      const account = store.accounts.find((entry) => entry.id === id);
      if (!account) throw new ConflictException('Account does not exist');
      if (input.username !== undefined) {
        const username = normalizeUsername(input.username);
        if (
          store.accounts.some(
            (entry) => entry.id !== id && entry.username === username,
          )
        )
          throw new ConflictException('Username is already in use');
        account.username = username;
      }
      if (input.name !== undefined) account.name = input.name.trim();
      if (input.password) await this.replacePassword(account, input.password);
      return publicUser(account);
    });
  }

  public async deleteManagedAccount(id: string): Promise<AuthUser> {
    if (
      (await this.groupMembers.getGroupMembers()).some(
        (member) => member.id === id,
      )
    )
      throw new ConflictException(
        'Remove this account from the group before deleting it',
      );
    return this.updateAccounts(async (store) => {
      const index = store.accounts.findIndex((entry) => entry.id === id);
      if (index < 0) throw new ConflictException('Account does not exist');
      if (store.accounts[index]?.role === UserRole.Admin)
        throw new ConflictException(
          'The administrator account cannot be deleted here',
        );
      const [account] = store.accounts.splice(index, 1);
      if (!account) throw new ConflictException('Account does not exist');
      await this.repository.deletePasswordResetChallenge(account.id);
      return publicUser(account);
    });
  }

  public requestFilesystemPasswordReset(username: string): Promise<void> {
    return this.serializeAccounts(async (store) => {
      const account = store.accounts.find(
        (entry) => entry.username === normalizeUsername(username),
      );
      if (!account) return;
      const activeChallenge = await this.repository.readPasswordResetChallenge(
        account.id,
      );
      if (activeChallenge && activeChallenge.expiresAt > Date.now()) return;
      await this.repository.writePasswordResetChallenge(account.id, {
        username: account.username,
        code: randomBytes(PASSWORD_RESET_RANDOM_BYTES).toString('base64url'),
        expiresAt: Date.now() + PASSWORD_RESET_LIFETIME_MS,
      });
    }, false);
  }

  public completeFilesystemPasswordReset(
    input: FilesystemPasswordResetComplete,
  ): Promise<void> {
    return this.updateAccounts(async (store) => {
      const account = store.accounts.find(
        (entry) => entry.username === normalizeUsername(input.username),
      );
      const challenge = account
        ? await this.repository.readPasswordResetChallenge(account.id)
        : undefined;
      if (
        !account ||
        !challenge ||
        challenge.username !== account.username ||
        challenge.expiresAt <= Date.now() ||
        !constantTimeEquals(challenge.code, input.code)
      )
        throw new UnauthorizedException('Invalid or expired recovery code.');
      await this.repository.deletePasswordResetChallenge(account.id);
      await this.replacePassword(account, input.password);
    });
  }

  public async login(
    username: string,
    password: string,
  ): Promise<{ user: AuthUser; token: string }> {
    const account = (await this.readAccounts()).accounts.find(
      (entry) => entry.username === normalizeUsername(username),
    );
    const passwordIsValid = await this.passwordHasher.verify(
      password,
      account?.passwordHash,
    );
    if (!account || !passwordIsValid)
      throw new UnauthorizedException('Invalid username or password');
    if (this.passwordHasher.needsRehash(account.passwordHash))
      await this.upgradePasswordHash(
        account.id,
        account.passwordHash,
        password,
      );
    return {
      user: publicUser(account),
      token: await this.createToken(account.id, account.sessionVersion),
    };
  }

  public async authenticate(token: string | undefined): Promise<AuthUser> {
    if (!token) throw new UnauthorizedException('Sign in required');
    const [payload, signature] = token.split('.');
    if (!payload || !signature)
      throw new UnauthorizedException('Invalid session');
    const expected = await this.sign(payload);
    if (!constantTimeEquals(signature, expected))
      throw new UnauthorizedException('Invalid session');
    let claims: { id: string; expires: number; sessionVersion?: number };
    try {
      claims = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { id: string; expires: number };
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
    if (claims.expires < Date.now())
      throw new UnauthorizedException('Session expired');
    const account = (await this.readAccounts()).accounts.find(
      (entry) => entry.id === claims.id,
    );
    if (!account) throw new UnauthorizedException('Account is unavailable');
    if ((claims.sessionVersion ?? 0) !== account.sessionVersion)
      throw new UnauthorizedException('Session expired');
    return publicUser(account);
  }

  public updateProfile(
    userId: string,
    name: string | undefined,
    username: string,
    password: string,
    color: UserColor | undefined,
  ): Promise<AuthUser> {
    return this.updateAccounts(async (store) => {
      const account = store.accounts.find((entry) => entry.id === userId);
      if (!account) throw new UnauthorizedException('Account is unavailable');
      const normalized = normalizeUsername(username);
      if (
        store.accounts.some(
          (entry) => entry.id !== userId && entry.username === normalized,
        )
      )
        throw new ConflictException('Username is already in use');
      account.username = normalized;
      if (name !== undefined) account.name = name.trim() || normalized;
      if (account.role === UserRole.User && color === UserColor.Gray)
        throw new BadRequestException(
          'Regular users cannot use the administrator color',
        );
      if (account.role === UserRole.User && color !== undefined)
        account.color = color;
      if (password.length > 0) await this.replacePassword(account, password);
      return publicUser(account);
    });
  }

  /** Hashes a replacement password and invalidates sessions signed with the previous one. */
  private async replacePassword(
    account: AuthAccount,
    password: string,
  ): Promise<void> {
    account.passwordHash = await this.passwordHasher.hash(password);
    account.sessionVersion += 1;
  }

  /** Rehashes a verified password without invalidating sessions for the same password. */
  private upgradePasswordHash(
    accountId: string,
    verifiedHash: string,
    password: string,
  ): Promise<void> {
    return this.updateAccounts(async (store) => {
      const account = store.accounts.find((entry) => entry.id === accountId);
      if (
        !account ||
        account.passwordHash !== verifiedHash ||
        !this.passwordHasher.needsRehash(account.passwordHash)
      )
        return;
      account.passwordHash = await this.passwordHasher.hash(password);
    });
  }

  private async createToken(
    id: string,
    sessionVersion: number,
  ): Promise<string> {
    const payload = Buffer.from(
      JSON.stringify({
        id,
        sessionVersion,
        expires: Date.now() + SESSION_LIFETIME_MS,
      }),
    ).toString('base64url');
    return `${payload}.${await this.sign(payload)}`;
  }

  private async sign(value: string): Promise<string> {
    const secret = await this.repository.readSessionSecret();
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private async readAccounts(): Promise<AccountsStore> {
    return { accounts: await this.repository.readAccounts() };
  }

  private async writeAccounts(store: AccountsStore): Promise<void> {
    return this.repository.writeAccounts(store.accounts);
  }

  private updateAccounts<T>(
    operation: (store: AccountsStore) => Promise<T> | T,
  ): Promise<T> {
    return this.serializeAccounts(operation, true);
  }

  private serializeAccounts<T>(
    operation: (store: AccountsStore) => Promise<T> | T,
    persist: boolean,
  ): Promise<T> {
    const result = this.accountWriteQueue.then(async () => {
      const store = await this.readAccounts();
      const output = await operation(store);
      if (persist) await this.writeAccounts(store);
      return output;
    });
    this.accountWriteQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
// #endregion

// #region Helpers
function publicUser(account: AuthAccount): AuthUser {
  return {
    id: account.id,
    name: account.name.trim() || account.username,
    username: account.username,
    role: account.role,
    color: account.role === UserRole.Admin ? UserColor.Gray : account.color,
  };
}

function getNextUserColor(accounts: readonly AuthAccount[]): UserColor {
  const choices = [
    UserColor.Blue,
    UserColor.Cyan,
    UserColor.Emerald,
    UserColor.Amber,
    UserColor.Rose,
    UserColor.Violet,
  ];
  const colorCounts = new Map<UserColor, number>(
    choices.map((color) => [color, 0]),
  );
  for (const account of accounts) {
    if (account.role !== UserRole.User) continue;
    const count = colorCounts.get(account.color);
    if (count !== undefined) colorCounts.set(account.color, count + 1);
  }
  return choices.reduce((leastUsed, color) =>
    (colorCounts.get(color) ?? 0) < (colorCounts.get(leastUsed) ?? 0)
      ? color
      : leastUsed,
  );
}
function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
// #endregion
