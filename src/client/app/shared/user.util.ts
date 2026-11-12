// #region Imports
import type { UserDto } from '../../api/generated/expense-exchange-api.schemas';
// #endregion

// #region User Helpers
export function userToString(user: UserDto): string {
  return user.name;
}

export function usersToString(users: UserDto[]): string {
  return users.map(userToString).join(', ');
}

export function userComparatorBool(first: UserDto, second: UserDto): boolean {
  return first.id === second.id;
}

export function userComparatorNum(first: UserDto, second: UserDto): number {
  return first.name.localeCompare(second.name);
}
// #endregion
