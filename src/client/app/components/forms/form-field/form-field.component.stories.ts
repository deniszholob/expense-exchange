// #region Imports
import { Meta, StoryObj } from '@storybook/angular';
import { FormFieldComponent } from './form-field.component';
// #endregion

// #region Stories
const meta: Meta<FormFieldComponent> = {
  component: FormFieldComponent,
  args: { $id: 'example-field', $label: 'Account name', $required: true },
};
export default meta;

export const Required: StoryObj<FormFieldComponent> = {
  render: (args) => ({
    props: args,
    template:
      '<app-form-field [$id]="$id" [$label]="$label" [$required]="$required"><input id="example-field" /></app-form-field>',
  }),
};
// #endregion
