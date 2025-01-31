// @ref https://storybook.js.org/docs/writing-stories
import { Meta, StoryObj } from '@storybook/angular';
import { StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';

import { ExpenseTableComponent } from './expense-table.component';
import { MOCK_Expense_Array } from 'src/app/api';
import { MOCK_DetailedExpense_Array } from 'src/app/shared/detailed-expense/detailed-expense.model.mock';

type ComponentWithCustomControls = ExpenseTableComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Components/Expense Table',
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
  render: (args): StoryFnAngularReturnType => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};
