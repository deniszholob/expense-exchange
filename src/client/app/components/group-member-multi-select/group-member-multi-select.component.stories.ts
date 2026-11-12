// #region Imports
import { Meta, StoryObj } from '@storybook/angular';
import { MOCK_GroupMembers } from 'src/client/app/expense-api.mock';
import { GroupMemberMultiSelectComponent } from './group-member-multi-select.component';
// #endregion

// #region Stories
const meta: Meta<GroupMemberMultiSelectComponent> = {
  component: GroupMemberMultiSelectComponent,
  args: {
    $groupMembers: MOCK_GroupMembers,
    value: [MOCK_GroupMembers[0]?.id ?? ''],
  },
};
export default meta;

export const GroupSelection: StoryObj<GroupMemberMultiSelectComponent> = {
  render: (args) => ({
    props: args,
    template:
      '<app-group-member-multi-select [$groupMembers]="$groupMembers" [(value)]="value"></app-group-member-multi-select>',
  }),
};
// #endregion
