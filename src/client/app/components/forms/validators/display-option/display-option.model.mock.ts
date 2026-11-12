// #region Imports
import type { DisplayOption } from './display-option.model';
// #endregion

// #region Mock Data
export const MOCK_DisplayOption: DisplayOption = {
  id: 'string',
  displayAs: 'String',
};

export const MOCK_DisplayOption_Array: DisplayOption[] = [MOCK_DisplayOption];
// #endregion

// ===== Advanced Mock with https://v9.fakerjs.dev/api/ ====== //
// export function createMock_DisplayOption(): DisplayOption {
//   return {
//     id: faker.string.uuid(),
//   };
// }

// export function createMock_DisplayOption_Array(count: number): DisplayOption[] {
//   return faker.helpers.multiple(createMock_DisplayOption, { count });
// }

// export const MOCK_DisplayOption: DisplayOption = createMock_DisplayOption();
// export const MOCK_DisplayOption_Array: DisplayOption[] = createMock_DisplayOption_Array(5);
