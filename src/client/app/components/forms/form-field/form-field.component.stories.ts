// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  TransactionScope,
  TRANSACTION_SCOPE_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-scope.enum';
import { FormFieldComponent, FormFieldIcon } from './form-field.component';
import { MultiSelectComponent } from '../multi-select/multi-select.component';
import { SegmentedControlComponent } from '../segmented-control/segmented-control.component';
import { DateInputComponent } from '../date-input/date-input.component';
// #endregion

// #region Stories
const meta: Meta<FormFieldComponent> = {
  component: FormFieldComponent,
  decorators: [
    moduleMetadata({
      imports: [
        MultiSelectComponent,
        SegmentedControlComponent,
        DateInputComponent,
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical stacked showcase of form controls. Update this story whenever a form-field type is added or changed.',
      },
    },
  },
  args: { $id: 'example-field', $label: 'Account name', $required: true },
};
export default meta;

export const FormField: StoryObj<FormFieldComponent> = {
  render: () => ({
    props: {
      multiSelectOptions: [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
      ],
      selectedOptions: ['alice'],
      scopeOptions: TRANSACTION_SCOPE_INFO_OPTIONS.map(({ id, display }) => ({
        value: id,
        label: display,
      })),
      selectedScope: TransactionScope.Group,
      FormFieldIcon,
    },
    template: `
      <div class="mx-auto flex w-full max-w-xl flex-col gap-5 p-5">
        <app-form-field [$id]="'expense-name'" [$label]="'Expense name'" [$required]="true" [$value]="'Groceries'" [$icon]="FormFieldIcon.Tag">
          <input id="expense-name" type="text" value="Groceries" />
        </app-form-field>
        <app-form-field [$id]="'server-url'" [$label]="'Remote API server URL'" [$value]="'http://localhost:3000'" [$icon]="FormFieldIcon.Link2">
          <input id="server-url" type="url" value="http://localhost:3000" />
        </app-form-field>
        <app-form-field [$id]="'password'" [$label]="'Password'" [$required]="true" [$value]="'sample-password'">
          <input id="password" type="password" value="sample-password" />
        </app-form-field>
        <app-form-field [$id]="'amount'" [$label]="'Amount'" [$required]="true" [$value]="64.25" [$icon]="FormFieldIcon.DollarSign">
          <input id="amount" type="number" value="64.25" />
        </app-form-field>
        <app-form-field [$id]="'date-paid'" [$label]="'Date paid'" [$required]="true" [$value]="'2026-11-12'" [$icon]="FormFieldIcon.CalendarDays">
          <app-date-input [$id]="'date-paid'" [value]="'2026-11-12'" />
        </app-form-field>
        <app-form-field [$id]="'paid-by'" [$label]="'Paid by'" [$required]="true" [$value]="'alice'" [$icon]="FormFieldIcon.UserRound">
          <select id="paid-by">
            <option value="alice" selected>Alice</option>
            <option value="bob">Bob</option>
          </select>
        </app-form-field>
        <app-form-field [$id]="'shared-with'" [$label]="'Shared with'" [$required]="true" [$value]="['alice']">
          <app-multi-select [$options]="multiSelectOptions" [(value)]="selectedOptions" />
        </app-form-field>
        <app-form-field [$id]="'transaction-scope'" [$label]="'Transaction scope'" [$value]="selectedScope" [$clearable]="false">
          <app-segmented-control [$options]="scopeOptions" [$label]="'Transaction scope'" [(value)]="selectedScope" />
        </app-form-field>
        <app-form-field [$id]="'notifications'" [$label]="'Notifications'" [$value]="true">
          <label class="text-finance-text flex items-center gap-2 text-sm">
            <input id="notifications" type="checkbox" checked />
            Send account notifications
          </label>
        </app-form-field>
        <app-form-field [$id]="'account-type-personal'" [$label]="'Account type'" [$required]="true" [$value]="'personal'">
          <fieldset class="flex flex-col gap-2">
            <legend class="sr-only">Choose an account type</legend>
            <label class="text-finance-text flex items-center gap-2 text-sm">
              <input id="account-type-personal" name="account-type" type="radio" value="personal" checked />
              Personal
            </label>
            <label class="text-finance-text flex items-center gap-2 text-sm">
              <input id="account-type-shared" name="account-type" type="radio" value="shared" />
              Shared
            </label>
          </fieldset>
        </app-form-field>
        <app-form-field [$id]="'note'" [$label]="'Note'" [$value]="'Weekly groceries'" [$icon]="FormFieldIcon.Pencil">
          <textarea id="note" rows="3">Weekly groceries</textarea>
        </app-form-field>
        <app-form-field [$id]="'locked-amount'" [$label]="'Fixed amount'" [$value]="64.25">
          <input id="locked-amount" type="number" value="64.25" readonly />
        </app-form-field>
        <app-form-field [$id]="'disabled-field'" [$label]="'Unavailable field'" [$value]="'Unavailable'">
          <input id="disabled-field" type="text" value="Unavailable" disabled />
        </app-form-field>
        <div class="flex flex-wrap gap-3 pt-2">
          <button class="btn-primary" type="button">Primary action</button>
          <button class="btn-secondary" type="button">Secondary action</button>
        </div>
      </div>
    `,
  }),
};
// #endregion
