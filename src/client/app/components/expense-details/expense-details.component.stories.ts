// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import { Meta, StoryObj } from '@storybook/angular';

import { ExpenseDetailsComponent } from './expense-details.component';
import { MOCK_Expense } from 'src/client/app/expense-api.mock';
import { MOCK_GroupMembers } from 'src/client/app/expense-api.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = ExpenseDetailsComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Components/Expense Details',
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
    groupMembers: MOCK_GroupMembers,
    expense: MOCK_Expense,
  },
};
export default meta;

export const ExpenseDetails: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
