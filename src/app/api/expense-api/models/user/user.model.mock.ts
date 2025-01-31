import { faker } from '@faker-js/faker';

import { User } from './user.model';

// ===== Simple Mock ====== //
// export const MOCK_User: User = {
//   id: 'string',
//   name: 'string',
// };

// export const MOCK_User_Array: User[] = [MOCK_User];

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
export function createMock_User(): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
  };
}

export function createMock_User_Array(count: number): User[] {
  return faker.helpers.multiple(createMock_User, { count });
}

export const MOCK_User: User = createMock_User();
export const MOCK_User_Array: User[] = createMock_User_Array(5);

console.log(`MOCK_User_Array`, MOCK_User_Array);
