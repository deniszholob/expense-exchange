// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { MOCK_GroupMembers } from 'src/client/app/expense-api.mock';
import { MultiSelectComponent } from './multi-select.component';
// #endregion

// #region Stories
const meta: Meta<MultiSelectComponent> = {
  component: MultiSelectComponent,
  args: {
    $options: MOCK_GroupMembers,
    value: [MOCK_GroupMembers[0]?.id ?? ''],
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
