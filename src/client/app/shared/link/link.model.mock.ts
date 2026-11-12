import { faker } from '@faker-js/faker';

import { Link } from './link.model';

// ===== Simple Mock ====== //
// export const MOCK_Link: Link = {
//   id: 'string',
// };

// export const MOCK_Link_Array: Link[] = [MOCK_Link];

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
export function createMock_Link(): Link {
  return {
    id: faker.string.uuid(),
    displayAs: faker.lorem.word(),
    note: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
  };
}

export function createMock_Link_Array(count: number): Link[] {
  return faker.helpers.multiple(createMock_Link, { count });
}

export const MOCK_Link: Link = createMock_Link();
export const MOCK_Link_Array: Link[] = createMock_Link_Array(5);
