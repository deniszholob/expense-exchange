// #region Imports
import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GroupMemberRepository } from '../group-member/group-member.repository.js';
import { AuthRepository } from './auth.repository.js';
import type { AuthAccount } from './auth-account.schema.js';
import type { AuthUser, LoginAccount } from './auth.schema.js';
import { UserRole } from './user-role.enum.js';
import { UserColor } from './user-color.enum.js';
// #endregion

// #region Types and Constants
const scrypt = promisify(scryptCallback);

const TOKEN_LIFETIME_DAYS = 14;
const TOKEN_LIFETIME_HOURS = 24 * TOKEN_LIFETIME_DAYS;
const TOKEN_LIFETIME_MINUTES = 60 * TOKEN_LIFETIME_HOURS;
const TOKEN_LIFETIME_SECONDS = 60 * TOKEN_LIFETIME_MINUTES;

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
  ) {}

  public async status(): Promise<{ setupRequired: boolean }> {
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
        passwordHash: await hashPassword(password),
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
        passwordHash: await hashPassword(password),
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
      if (input.password)
        account.passwordHash = await hashPassword(input.password);
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
    return this.updateAccounts((store) => {
      const index = store.accounts.findIndex((entry) => entry.id === id);
      if (index < 0) throw new ConflictException('Account does not exist');
      if (store.accounts[index]?.role === UserRole.Admin)
        throw new ConflictException(
          'The administrator account cannot be deleted here',
        );
      return publicUser(store.accounts.splice(index, 1)[0]!);
    });
  }

  public async login(
    username: string,
    password: string,
  ): Promise<{ user: AuthUser; token: string }> {
    const account = (await this.readAccounts()).accounts.find(
      (entry) => entry.username === normalizeUsername(username),
    );
    if (!account || !(await verifyPassword(password, account.passwordHash)))
      throw new UnauthorizedException('Invalid username or password');
    return {
      user: publicUser(account),
      token: await this.createToken(account.id),
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
    let claims: { id: string; expires: number };
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
      if (password.length > 0)
        account.passwordHash = await hashPassword(password);
      return publicUser(account);
    });
  }

  private async createToken(id: string): Promise<string> {
    const payload = Buffer.from(
      JSON.stringify({
        id,
        expires: Date.now() + TOKEN_LIFETIME_SECONDS * 1000,
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
    const result = this.accountWriteQueue.then(async () => {
      const store = await this.readAccounts();
      const output = await operation(store);
      await this.writeAccounts(store);
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
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}
async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = (await scrypt(
    password,
    Buffer.from(saltHex, 'hex'),
    expected.length,
  )) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
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
