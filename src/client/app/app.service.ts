// #region Imports
import { Injectable, computed, effect, signal } from '@angular/core';
import { expenseControllerGetExpensesResource } from '../api/generated/expenses/expenses.resource';
import { userControllerGetUsersResource } from '../api/generated/users/users.resource';
import type {
  ExpenseDto,
  UserDto,
} from '../api/generated/expense-exchange-api.schemas';
import { DATA_SOURCE_INFO, DataSource } from './shared/data-source.enum';
import type { DetailedExpense } from './shared/detailed-expense/detailed-expense.model';
// #endregion

// #region Service
@Injectable({ providedIn: 'root' })
export class AppService {
  private readonly usersResource = userControllerGetUsersResource({
    defaultValue: [],
  });
  private readonly expensesResource = expenseControllerGetExpensesResource({
    defaultValue: [],
  });

  public readonly $users = this.usersResource.value;
  public readonly $expenses = this.expensesResource.value;
  public readonly $detailedExpenses = computed(() =>
    expensesUserIdToDetailedExpense(
      this.$expenses(),
      userArrayToMapById(this.$users()),
    ),
  );
  public readonly $currentUser = signal<UserDto | undefined>(undefined);
  public readonly $apiLoading = computed(
    () => this.usersResource.isLoading() || this.expensesResource.isLoading(),
  );
  public readonly $apiError = computed(
    () => this.usersResource.error() ?? this.expensesResource.error(),
  );

  public dataSource: DataSource = DataSource.WebStorage;
  public dataSourcePath: Record<DataSource, string> = {
    [DataSource.WebStorage]: DATA_SOURCE_INFO[DataSource.WebStorage].path,
    [DataSource.RemoteApi]: DATA_SOURCE_INFO[DataSource.RemoteApi].path,
    [DataSource.LocalFile]: DATA_SOURCE_INFO[DataSource.LocalFile].path,
  };

  public constructor() {
    effect(() => {
      const users = this.$users();
      const currentUser = this.$currentUser();
      if (currentUser) {
        const refreshedUser = users.find((user) => user.id === currentUser.id);
        if (refreshedUser !== currentUser) {
          this.$currentUser.set(refreshedUser ?? users.at(0));
        }
      } else if (users[0]) {
        this.$currentUser.set(users[0]);
      }
    });
  }

  public switchUser(user: UserDto | undefined): void {
    this.$currentUser.set(user);
  }

  public refreshExpenses(): void {
    this.expensesResource.reload();
  }

  public refreshUsers(): void {
    this.usersResource.reload();
  }
}
// #endregion

// #region Helpers
function userArrayToMapById(users: UserDto[]): Map<string, UserDto> {
  return new Map(users.map((user) => [user.id, user]));
}

function expenseUserIdToRender(
  id: string,
  users: Map<string, UserDto>,
): UserDto {
  return users.get(id) ?? { id, name: id };
}

function expensesUserIdToDetailedExpense(
  expenses: ExpenseDto[],
  users: Map<string, UserDto>,
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
