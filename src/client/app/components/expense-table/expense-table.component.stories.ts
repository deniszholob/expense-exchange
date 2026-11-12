// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import { Meta, StoryObj } from '@storybook/angular-vite';

import { ExpenseTableComponent } from './expense-table.component';
import { MOCK_DetailedExpense_Array } from 'src/client/app/shared/detailed-expense/detailed-expense.model.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = ExpenseTableComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Components/Expense Table',
  component: ExpenseTableComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `ExpenseTable` } },
    // layout: 'fullscreen',
  },
  argTypes: {
    /** === Input Mapping === */
    // input: { options: ['---', ...Object.values(YourEnum)], mapping: YourEnum & { '---': undefined }, control: { type: 'select' }}
    /** === Output Actions === */
    add: { action: 'add', table: { disable: true } },
    edit: { action: 'edit', table: { disable: true } },
    delete: { action: 'delete', table: { disable: true } },
    /** === Control Hide === */
    // someControl: { table: { disable: true } }
    /** === Control Disable === */
    // someControl: { control: { disable: true } }
  },
  args: {
    expenses: MOCK_DetailedExpense_Array,
  },
};
export default meta;

export const ExpenseTable: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
