// @ref https://storybook.js.org/docs/writing-stories
import { Meta, StoryObj } from '@storybook/angular';
import { StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';

import { ExpenseDetailsComponent } from './expense-details.component';
import { MOCK_Expense, MOCK_User_Array } from 'src/app/api';

type ComponentWithCustomControls = ExpenseDetailsComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Components/Expense Details',
  component: ExpenseDetailsComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `ExpenseDetails` } },
    // layout: 'fullscreen',
  },
  argTypes: {
    /** === Input Mapping === */
    // input: { options: ['---', ...Object.values(YourEnum)], mapping: YourEnum & { '---': undefined }, control: { type: 'select' }}
    /** === Output Actions === */
    save: { action: 'save', table: { disable: true } },
    /** === Control Hide === */
    // someControl: { table: { disable: true } }
    /** === Control Disable === */
    // someControl: { control: { disable: true } }
  },
  args: {
    users: MOCK_User_Array,
    expense: MOCK_Expense,
  },
};
export default meta;

export const ExpenseDetails: StoryObj<ComponentWithCustomControls> = {
  render: (args): StoryFnAngularReturnType => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};
