// #region Imports
import {
  Injectable,
  Injector,
  computed,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import type { HttpResourceRef } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { z } from 'zod';
import { AuthService as AuthApiService } from 'src/client/api/generated/auth/auth.service';
import { authControllerListLoginAccountsResource } from 'src/client/api/generated/auth/auth.resource';
import { HealthService } from 'src/client/api/generated/health/health.service';
import { transactionControllerGetTransactionsResource } from 'src/client/api/generated/transactions/transactions.resource';
import { groupMembersControllerGetMembersResource } from 'src/client/api/generated/group-members/group-members.resource';
import {
  UserRole,
  type AuthUserDto,
  type LoginAccountDto,
  type GroupMemberDto,
  type TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { DATA_SOURCE_INFO, DataSource } from './shared/data-source.enum';
import { getConfiguredRemoteApiUrl } from './shared/remote-api-config';
import { getHttpErrorMessage } from './shared/http-error-message';
import { LocalTransactionSchema } from 'src/client/app/shared/local-transaction.schema';
// #endregion

// #region Constants
const DATA_SOURCE_STORAGE_KEY = 'expense-exchange.data-source';
// #endregion

// #region Service
@Injectable({ providedIn: 'root' })
export class AppService {
  private readonly authApi = inject(AuthApiService);
  private readonly healthApi = inject(HealthService);
  private readonly injector = inject(Injector);
  private remoteConnectionCheckId = 0;
  private readonly $groupMembersResource = signal<
    HttpResourceRef<GroupMemberDto[]> | undefined
  >(undefined);
  private readonly $transactionsResource = signal<
    HttpResourceRef<TransactionDto[]> | undefined
  >(undefined);
  private readonly $loginAccountsResource = signal<
    HttpResourceRef<LoginAccountDto[]> | undefined
  >(undefined);

  private readonly $localStore = signal(readLocalStore());
  public readonly $groupMembers = computed(() => {
    if (this.$dataSource() === DataSource.Local)
      return this.$localStore().users;
    const resource = this.$groupMembersResource();
    return resource?.hasValue() ? resource.value() : [];
  });
  public readonly $groupMembersReady = computed(
    () =>
      this.$dataSource() === DataSource.Local ||
      this.$groupMembersResource()?.hasValue() === true,
  );
  public readonly $availableLocalUsers = computed(
    () => this.$localStore().availableUsers,
  );
  public readonly $loginAccounts = computed(() => {
    const resource = this.$loginAccountsResource();
    return resource?.hasValue() ? resource.value() : [];
  });
  public readonly $transactions = computed(() => {
    if (this.$dataSource() === DataSource.Local)
      return this.$localStore().transactions;
    const resource = this.$transactionsResource();
    return resource?.hasValue() ? resource.value() : [];
  });
  public readonly $currentUser = signal<AuthUserDto | undefined>(undefined);
  public readonly $authSetupRequired = signal<boolean>(false);
  public readonly $authStatusReady = signal<boolean>(false);
  public readonly $authError = signal<string | undefined>(undefined);
  public readonly $apiHealthy = signal<boolean | undefined>(undefined);
  public readonly $apiLoading = computed(
    () =>
      this.$groupMembersResource()?.isLoading() === true ||
      this.$transactionsResource()?.isLoading() === true,
  );
  public readonly $apiError = computed(
    () =>
      this.$groupMembersResource()?.error() ??
      this.$transactionsResource()?.error(),
  );

  public readonly $dataSource = signal(readDataSource());
  public readonly $dataSourceConfigured = signal(isDataSourceConfigured());
  public dataSourcePath: Record<DataSource, string> = {
    [DataSource.Local]: DATA_SOURCE_INFO[DataSource.Local].path,
    [DataSource.RemoteApi]: getConfiguredRemoteApiUrl(),
  };

  public constructor() {
    if (this.$dataSource() === DataSource.Local)
      this.$currentUser.set(LOCAL_AUTH_USER);
  }

  public signOut(): void {
    if (this.$dataSource() === DataSource.Local) return;
    void firstValueFrom(this.authApi.authControllerLogout())
      .catch(() => undefined)
      .finally(() => {
        this.$currentUser.set(undefined);
        this.$groupMembersResource.set(undefined);
        this.$transactionsResource.set(undefined);
      });
  }

  public async signIn(username: string, password: string): Promise<void> {
    this.$authError.set(undefined);
    try {
      const result = await firstValueFrom(
        this.authApi.authControllerLogin({ username, password }),
      );
      this.$currentUser.set(result.user);
      this.ensureRemoteResources();
    } catch (error: unknown) {
      this.$authError.set(getHttpErrorMessage(error, 'Unable to sign in.'));
      throw error;
    }
  }

  public async setupAdmin(
    name: string,
    username: string,
    password: string,
  ): Promise<void> {
    this.$authError.set(undefined);
    try {
      const result = await firstValueFrom(
        this.authApi.authControllerSetup({ name, username, password }),
      );
      this.$currentUser.set(result.user);
      this.$authSetupRequired.set(false);
      this.ensureRemoteResources();
    } catch (error: unknown) {
      this.$authError.set(
        getHttpErrorMessage(
          error,
          'Unable to create the administrator account.',
        ),
      );
      throw error;
    }
  }

  public async updateProfile(
    name: string,
    username: string,
    password: string,
  ): Promise<void> {
    const user = await firstValueFrom(
      this.authApi.authControllerUpdateProfile({
        name: name.trim(),
        username,
        password: password || undefined,
      }),
    );
    this.$currentUser.set(user);
  }

  public readonly authenticationReady: Promise<void> =
    this.loadAuthenticationState();

  public async connectToRemoteApi(): Promise<void> {
    const checkId = ++this.remoteConnectionCheckId;
    this.$authStatusReady.set(false);
    this.$authError.set(undefined);
    this.$apiHealthy.set(undefined);
    this.$authSetupRequired.set(false);
    this.$currentUser.set(undefined);
    this.$groupMembersResource.set(undefined);
    this.$transactionsResource.set(undefined);
    this.$loginAccountsResource.set(undefined);
    try {
      await firstValueFrom(
        this.healthApi
          .healthControllerGetHealth()
          .pipe(timeout({ first: REMOTE_STATUS_TIMEOUT_MS })),
      );
      if (checkId !== this.remoteConnectionCheckId) return;
      this.$apiHealthy.set(true);
      const status = await firstValueFrom(
        this.authApi
          .authControllerStatus()
          .pipe(timeout({ first: REMOTE_STATUS_TIMEOUT_MS })),
      );
      if (checkId !== this.remoteConnectionCheckId) return;
      this.$authSetupRequired.set(status.setupRequired);
      if (!status.setupRequired) {
        this.ensureLoginAccountsResource();
        try {
          const result = await firstValueFrom(
            this.authApi
              .authControllerMe()
              .pipe(timeout({ first: REMOTE_STATUS_TIMEOUT_MS })),
          );
          if (checkId !== this.remoteConnectionCheckId) return;
          this.$currentUser.set(result);
          this.ensureRemoteResources();
        } catch {
          if (checkId !== this.remoteConnectionCheckId) return;
          this.$currentUser.set(undefined);
        }
      }
    } catch {
      if (checkId !== this.remoteConnectionCheckId) return;
      this.$apiHealthy.set(false);
      this.$authError.set(
        'Unable to connect to the selected API. Check the server URL and status.',
      );
    } finally {
      if (checkId === this.remoteConnectionCheckId)
        this.$authStatusReady.set(true);
    }
  }

  public upsertLocalGroupMember(user: GroupMemberDto): void {
    this.updateLocalStore((store) => ({
      ...store,
      users: [...store.users.filter((item) => item.id !== user.id), user],
    }));
  }

  public upsertLocalAvailableUser(user: GroupMemberDto): void {
    this.updateLocalStore((store) => ({
      ...store,
      availableUsers: [
        ...store.availableUsers.filter((item) => item.id !== user.id),
        user,
      ],
    }));
  }

  public removeLocalAvailableUser(id: string): void {
    this.updateLocalStore((store) => ({
      ...store,
      availableUsers: store.availableUsers.filter((item) => item.id !== id),
    }));
  }

  public removeLocalGroupMember(id: string): void {
    this.updateLocalStore((store) => ({
      ...store,
      users: store.users.filter((item) => item.id !== id),
    }));
  }

  public upsertLocalTransaction(transaction: TransactionDto): void {
    this.updateLocalStore((store) => ({
      ...store,
      transactions: [
        ...store.transactions.filter((item) => item.id !== transaction.id),
        transaction,
      ],
    }));
  }

  public removeLocalTransaction(id: string): void {
    this.updateLocalStore((store) => ({
      ...store,
      transactions: store.transactions.filter((item) => item.id !== id),
    }));
  }

  public loadLocalStore(value: unknown): boolean {
    const parsed = LocalStoreSchema.safeParse(value);
    if (!parsed.success) return false;
    this.updateLocalStore(() => ({
      version: parsed.data.version,
      users: parsed.data.users,
      availableUsers: parsed.data.availableUsers ?? parsed.data.users,
      transactions: parsed.data.transactions,
    }));
    return true;
  }
  public exportLocalStore(): LocalStore {
    return this.$localStore();
  }
  public clearLocalStore(): void {
    this.updateLocalStore(() => ({
      version: 2,
      users: [],
      availableUsers: [],
      transactions: [],
    }));
  }
  public selectDataSource(source: DataSource): void {
    this.remoteConnectionCheckId++;
    const previousSource = this.$dataSource();
    this.$dataSource.set(source);
    this.$dataSourceConfigured.set(true);
    try {
      window.localStorage.setItem(DATA_SOURCE_STORAGE_KEY, source);
    } catch {
      // Continue with the selected source for this session if storage is unavailable.
    }
    this.$authError.set(undefined);
    this.$apiHealthy.set(undefined);
    this.$authSetupRequired.set(false);
    this.$authStatusReady.set(source === DataSource.Local);
    this.$groupMembersResource.set(undefined);
    this.$transactionsResource.set(undefined);
    this.$loginAccountsResource.set(undefined);
    if (source === DataSource.Local) {
      this.$currentUser.set(LOCAL_AUTH_USER);
      if (previousSource === DataSource.RemoteApi)
        void firstValueFrom(this.authApi.authControllerLogout()).catch(
          () => undefined,
        );
      return;
    }
    this.$currentUser.set(undefined);
  }

  public refreshTransactions(): void {
    const resource = this.$transactionsResource();
    if (resource) resource.reload();
    else if (this.$currentUser()) this.ensureRemoteResources();
  }

  public refreshGroupMembers(): void {
    const resource = this.$groupMembersResource();
    if (resource) resource.reload();
    else if (this.$currentUser()) this.ensureRemoteResources();
  }

  private async loadAuthenticationState(): Promise<void> {
    if (
      !this.$dataSourceConfigured() ||
      this.$dataSource() === DataSource.Local
    )
      return;
    await this.connectToRemoteApi();
  }

  private ensureRemoteResources(): void {
    if (this.$groupMembersResource() && this.$transactionsResource()) return;
    runInInjectionContext(this.injector, () => {
      if (!this.$groupMembersResource())
        this.$groupMembersResource.set(
          groupMembersControllerGetMembersResource({ defaultValue: [] }),
        );
      if (!this.$transactionsResource())
        this.$transactionsResource.set(
          transactionControllerGetTransactionsResource({ defaultValue: [] }),
        );
    });
  }

  private ensureLoginAccountsResource(): void {
    if (this.$loginAccountsResource()) return;
    runInInjectionContext(this.injector, () => {
      this.$loginAccountsResource.set(
        authControllerListLoginAccountsResource({ defaultValue: [] }),
      );
    });
  }

  private updateLocalStore(update: (store: LocalStore) => LocalStore): void {
    const store = update(this.$localStore());
    this.$localStore.set(store);
    window.localStorage.setItem(LOCAL_DATA_STORAGE_KEY, JSON.stringify(store));
  }
}
// #endregion

// #region Helpers
export interface LocalStore {
  version: 2;
  users: GroupMemberDto[];
  availableUsers: GroupMemberDto[];
  transactions: TransactionDto[];
}

const LOCAL_DATA_STORAGE_KEY = 'expense-exchange.local-data';
const REMOTE_STATUS_TIMEOUT_MS = 6000;
const LOCAL_AUTH_USER: AuthUserDto = {
  id: 'local-user',
  name: 'Local',
  username: 'local',
  role: UserRole.User,
};
const LocalStoreSchema = z.object({
  version: z.literal(2),
  users: z.array(z.object({ id: z.string(), name: z.string() })),
  availableUsers: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional(),
  transactions: z.array(LocalTransactionSchema),
});

function readLocalStore(): LocalStore {
  try {
    const serialized = window.localStorage.getItem(LOCAL_DATA_STORAGE_KEY);
    if (serialized) {
      const parsed: unknown = JSON.parse(serialized);
      const result = LocalStoreSchema.safeParse(parsed);
      if (result.success) {
        return {
          version: result.data.version,
          users: result.data.users,
          availableUsers: result.data.availableUsers ?? result.data.users,
          transactions: result.data.transactions,
        };
      }
    }
  } catch {
    /* Use a clean local store when browser storage is unavailable or invalid. */
  }
  return {
    version: 2,
    users: [],
    availableUsers: [],
    transactions: [],
  };
}

function readDataSource(): DataSource {
  try {
    return window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY) ===
      DataSource.Local
      ? DataSource.Local
      : DataSource.RemoteApi;
  } catch {
    return DataSource.RemoteApi;
  }
}

function isDataSourceConfigured(): boolean {
  try {
    const storedSource = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);
    return (
      storedSource === DataSource.Local || storedSource === DataSource.RemoteApi
    );
  } catch {
    return false;
  }
}

// #endregion
