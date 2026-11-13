// #region Imports
import type { GroupMemberDto } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region User Helpers
export function userToString(user: GroupMemberDto): string {
  return user.name;
}

export function usersToString(users: GroupMemberDto[]): string {
  return users.map(userToString).join(', ');
}

export function userComparatorBool(
  first: GroupMemberDto,
  second: GroupMemberDto,
): boolean {
  return first.id === second.id;
}

export function userComparatorNum(
  first: GroupMemberDto,
  second: GroupMemberDto,
): number {
  return first.name.localeCompare(second.name);
}
// #endregion
