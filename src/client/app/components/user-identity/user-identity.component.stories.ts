// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UserColor } from 'src/client/api/generated/expense-exchange-api.schemas';
import { UserIdentityComponent } from './user-identity.component';
// #endregion

// #region Stories
const meta: Meta<UserIdentityComponent> = {
  component: UserIdentityComponent,
  decorators: [moduleMetadata({ imports: [UserIdentityComponent] })],
  args: {
    $displayName: 'Bob',
    $username: 'bob',
    $color: UserColor.Cyan,
  },
};
export default meta;

export const GroupMember: StoryObj<UserIdentityComponent> = {};

export const Administrator: StoryObj<UserIdentityComponent> = {
  args: {
    $displayName: 'Alex Morgan',
    $username: 'alex',
    $color: UserColor.Gray,
    $isAdmin: true,
  },
};
// #endregion
