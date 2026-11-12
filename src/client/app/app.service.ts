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
import { AuthService as AuthApiService } from '../api/generated/auth/auth.service';
import { authControllerListLoginAccountsResource } from '../api/generated/auth/auth.resource';
import { HealthService } from '../api/generated/health/health.service';
import { expenseControllerGetExpensesResource } from '../api/generated/expenses/expenses.resource';
import { groupMembersControllerGetMembersResource } from '../api/generated/group-members/group-members.resource';
import {
  AuthUserDtoRole,
  type AuthUserDto,
  type LoginAccountDto,
  ExpenseDto,
  GroupMemberDto,
} from '../api/generated/expense-exchange-api.schemas';
import { DATA_SOURCE_INFO, DataSource } from './shared/data-source.enum';
import type { DetailedExpense } from './shared/detailed-expense/detailed-expense.model';
import { getConfiguredRemoteApiUrl } from './shared/remote-api-config';
import { UserRole } from '../../util/user-role.enum';
import { getHttpErrorMessage } from './shared/http-error-message';
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
  private readonly $expensesResource = signal<
    HttpResourceRef<ExpenseDto[]> | undefined
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
  public readonly $expenses = computed(() => {
    if (this.$dataSource() === DataSource.Local)
      return this.$localStore().expenses;
    const resource = this.$expensesResource();
    return resource?.hasValue() ? resource.value() : [];
  });
  public readonly $detailedExpenses = computed(() =>
    expensesUserIdToDetailedExpense(
      this.$expenses(),
      groupMemberArrayToMapById(this.$groupMembers()),
    ),
  );
  public readonly $currentUser = signal<AuthUser | undefined>(undefined);
  public readonly $authSetupRequired = signal<boolean>(false);
  public readonly $authStatusReady = signal<boolean>(false);
  public readonly $authError = signal<string | undefined>(undefined);
  public readonly $apiHealthy = signal<boolean | undefined>(undefined);
  public readonly $apiLoading = computed(
    () =>
      this.$groupMembersResource()?.isLoading() === true ||
      this.$expensesResource()?.isLoading() === true,
  );
  public readonly $apiError = computed(
    () =>
      this.$groupMembersResource()?.error() ??
      this.$expensesResource()?.error(),
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
        this.$expensesResource.set(undefined);
      });
  }

  public async signIn(username: string, password: string): Promise<void> {
    this.$authError.set(undefined);
    try {
      const result = await firstValueFrom(
        this.authApi.authControllerLogin({ username, password }),
      );
      this.$currentUser.set(toAuthUser(result.user));
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
      this.$currentUser.set(toAuthUser(result.user));
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
    username: string,
    password: string,
  ): Promise<void> {
    const user = await firstValueFrom(
      this.authApi.authControllerUpdateProfile({
        username,
        password: password || undefined,
      }),
    );
    this.$currentUser.set(toAuthUser(user));
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
    this.$expensesResource.set(undefined);
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
          this.$currentUser.set(toAuthUser(result));
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

  public upsertLocalExpense(expense: ExpenseDto): void {
    this.updateLocalStore((store) => ({
      ...store,
      expenses: [
        ...store.expenses.filter((item) => item.id !== expense.id),
        expense,
      ],
    }));
  }

  public removeLocalExpense(id: string): void {
    this.updateLocalStore((store) => ({
      ...store,
      expenses: store.expenses.filter((item) => item.id !== id),
    }));
  }

  public loadLocalStore(value: unknown): boolean {
    const parsed = LocalStoreSchema.safeParse(value);
    if (!parsed.success) return false;
    this.updateLocalStore(() => ({
      ...parsed.data,
      availableUsers: parsed.data.availableUsers ?? parsed.data.users,
    }));
    return true;
  }
  public exportLocalStore(): LocalStore {
    return this.$localStore();
  }
  public clearLocalStore(): void {
    this.updateLocalStore(() => ({
      version: 1,
      users: [],
      availableUsers: [],
      expenses: [],
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
    this.$expensesResource.set(undefined);
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

  public refreshExpenses(): void {
    const resource = this.$expensesResource();
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
    if (this.$groupMembersResource() && this.$expensesResource()) return;
    runInInjectionContext(this.injector, () => {
      if (!this.$groupMembersResource())
        this.$groupMembersResource.set(
          groupMembersControllerGetMembersResource({ defaultValue: [] }),
        );
      if (!this.$expensesResource())
        this.$expensesResource.set(
          expenseControllerGetExpensesResource({ defaultValue: [] }),
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
export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface LocalStore {
  version: 1;
  users: GroupMemberDto[];
  availableUsers: GroupMemberDto[];
  expenses: ExpenseDto[];
}

const LOCAL_DATA_STORAGE_KEY = 'expense-exchange.local-data';
const REMOTE_STATUS_TIMEOUT_MS = 6000;
const LOCAL_AUTH_USER: AuthUser = {
  id: 'local-user',
  name: 'Local',
  username: 'local',
  role: UserRole.User,
};
const LocalStoreSchema = z.object({
  version: z.literal(1),
  users: z.array(z.object({ id: z.string(), name: z.string() })),
  availableUsers: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional(),
  expenses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      amount: z.number(),
      datePaid: z.string(),
      forDate: z.string(),
      paidByUserId: z.string(),
      paidForUserIds: z.array(z.string()),
    }),
  ),
});

function toAuthUser(user: AuthUserDto): AuthUser {
  return {
    ...user,
    role: user.role === AuthUserDtoRole.Admin ? UserRole.Admin : UserRole.User,
  };
}

function readLocalStore(): LocalStore {
  try {
    const serialized = window.localStorage.getItem(LOCAL_DATA_STORAGE_KEY);
    if (serialized) {
      const parsed: unknown = JSON.parse(serialized);
      const result = LocalStoreSchema.safeParse(parsed);
      if (result.success) {
        return {
          ...result.data,
          availableUsers: result.data.availableUsers ?? result.data.users,
        };
      }
    }
  } catch {
    /* Use a clean local store when browser storage is unavailable or invalid. */
  }
  return { version: 1, users: [], availableUsers: [], expenses: [] };
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

function groupMemberArrayToMapById(
  users: GroupMemberDto[],
): Map<string, GroupMemberDto> {
  return new Map(users.map((user) => [user.id, user]));
}

function expenseUserIdToRender(
  id: string,
  users: Map<string, GroupMemberDto>,
): GroupMemberDto {
  return users.get(id) ?? { id, name: id };
}

function expensesUserIdToDetailedExpense(
  expenses: ExpenseDto[],
  users: Map<string, GroupMemberDto>,
): DetailedExpense[] {
  return expenses.map((expense) => ({
    ...expense,
    paidByUser: expenseUserIdToRender(expense.paidByUserId, users),
    paidForUsers: expense.paidForUserIds.map((id) =>
      expenseUserIdToRender(id, users),
    ),
  }));
}
// #endregion
