export interface User {
  id: string;
  name: string;
  // icon: string;
  // email: string;
  // password: string;
}

export function userToString(user: User): string {
  return user.name;
}

export function usersToString(users: User[]): string {
  return users.map((user: User): string => userToString(user)).join(', ');
}

export function userComparatorBool(a: User, b: User): boolean {
  return a.id === b.id;
}

export function userComparatorNum(a: User, b: User): number {
  return a.name.localeCompare(b.name);
}
