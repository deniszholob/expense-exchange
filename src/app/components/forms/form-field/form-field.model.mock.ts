// import { faker } from '@faker-js/faker';

import { FormField } from './form-field.model';

// ===== Simple Mock ====== //
export const MOCK_FormField: FormField = {
  id: 'id',
  label: 'label',
  formControl: null, // TODO: Mock AbstractControl
};

export const MOCK_FormField_Array: FormField[] = [MOCK_FormField];

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
// export function createMock_FormField(): FormField {
//   return {
//     id: faker.string.uuid(),
//   };
// }

// export function createMock_FormField_Array(count: number): FormField[] {
//   return faker.helpers.multiple(createMock_FormField, { count });
// }

// export const MOCK_FormField: FormField = createMock_FormField();
// export const MOCK_FormField_Array: FormField[] = createMock_FormField_Array(5);
