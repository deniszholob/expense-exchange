// #region Imports
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AccountFieldsComponent } from './account-fields.component';
// #endregion

// #region Stories
const accountData = signal({
  name: 'Alice',
  username: 'alice',
  password: 'sample-password',
});
const accountForm = form(accountData);

const meta: Meta<AccountFieldsComponent> = {
  component: AccountFieldsComponent,
  parameters: {
    docs: {
      description: {
        component:
          'Shared display name, username, and password fields for account creation and editing. Validation and account actions remain with the owning page.',
      },
    },
  },
};
export default meta;

export const AccountFields: StoryObj<AccountFieldsComponent> = {
  render: () => ({
    props: { accountForm },
    template: `
      <div class="mx-auto w-full max-w-xl p-5">
        <app-account-fields
          [$idPrefix]="'account-story'"
          [$nameField]="accountForm.name"
          [$usernameField]="accountForm.username"
          [$passwordField]="accountForm.password"
          [$passwordLabel]="'New password'"
          [$passwordPlaceholder]="'Leave blank to keep the current password'"
        />
      </div>
    `,
  }),
};
// #endregion
