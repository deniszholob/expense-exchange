// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { FormFieldComponent } from '../form-field/form-field.component';
import { DateInputComponent } from './date-input.component';
// #endregion

// #region Stories
const meta: Meta<DateInputComponent> = {
  component: DateInputComponent,
  decorators: [moduleMetadata({ imports: [FormFieldComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          'ISO date input with selectable, copyable text and a native calendar picker opened from the empty area of the field.',
      },
    },
  },
  args: { $id: 'date-input-story', value: '2026-11-13' },
};
export default meta;

export const Default: StoryObj<DateInputComponent> = {
  render: () => ({
    template: `
      <div class="mx-auto w-full max-w-xl p-5">
        <app-form-field [$id]="'date-input-story'" [$label]="'Date paid'" [$required]="true" [$value]="'2026-11-13'">
          <app-date-input [$id]="'date-input-story'" [value]="'2026-11-13'" />
        </app-form-field>
      </div>
    `,
  }),
};
// #endregion
