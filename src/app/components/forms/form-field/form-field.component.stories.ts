// @ref https://storybook.js.org/docs/writing-stories
import { Meta, StoryObj } from '@storybook/angular';
import { StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';

import { FormFieldComponent } from './form-field.component';
import { MOCK_FormField } from './form-field.model.mock';
import { StorybookFormControl } from 'src/app/utils/storybook/storybook.util';
import { Validators } from '@angular/forms';

type ComponentWithCustomControls = FormFieldComponent; // & {};
const formControl = new StorybookFormControl();
formControl.addValidators(Validators.required);
formControl.setValue(null);
formControl.updateValueAndValidity();

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Components/Forms/Form Field',
  component: FormFieldComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `FormField` } },
    // layout: 'fullscreen',
  },
  argTypes: {
    /** === Input Mapping === */
    // input: { options: ['---', ...Object.values(YourEnum)], mapping: YourEnum & { '---': undefined }, control: { type: 'select' }}
    /** === Output Actions === */
    // inputChange: { action: 'inputChange', table: { disable: true } }
    /** === Control Hide === */
    // someControl: { table: { disable: true } }
    /** === Control Disable === */
    // someControl: { control: { disable: true } }
  },
  args: {
    formField: { ...MOCK_FormField, formControl },
  },
};
export default meta;

export const FormField: StoryObj<ComponentWithCustomControls> = {
  render: (args): StoryFnAngularReturnType => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};
