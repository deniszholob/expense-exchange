// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOCK_GroupMember_Array } from 'src/client/api/mocks/transaction-api.mock';
import { MultiSelectComponent } from './multi-select.component';
// #endregion

// #region Stories
const meta: Meta<MultiSelectComponent> = {
  component: MultiSelectComponent,
  args: {
    $options: MOCK_GroupMember_Array,
    value: [MOCK_GroupMember_Array[0]?.id ?? ''],
  },
};
export default meta;

export const MultiSelect: StoryObj<MultiSelectComponent> = {
  render: (args) => ({
    props: args,
    template:
      '<app-multi-select [$options]="$options" [(value)]="value"></app-multi-select>',
  }),
};
// #endregion
