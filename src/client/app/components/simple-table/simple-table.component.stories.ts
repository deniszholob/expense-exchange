// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import { Meta, StoryObj } from '@storybook/angular';

import { SimpleTableComponent } from './simple-table.component';
import { ExpenseDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { MOCK_Expense_Array } from 'src/client/app/expense-api.mock';
import { MOCK_ColDef_Expense } from './simple-table.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = SimpleTableComponent<ExpenseDto>; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Components/Simple Table',
  component: SimpleTableComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `SimpleTable` } },
    // layout: 'fullscreen',
  },
  argTypes: {
    /** === Input Mapping === */
    // input: { options: ['---', ...Object.values(YourEnum)], mapping: YourEnum & { '---': undefined }, control: { type: 'select' }}
    /** === Output Actions === */
    editRowEmitter: { action: 'editRowEmitter', table: { disable: true } },
    deleteRowEmitter: { action: 'deleteRowEmitter', table: { disable: true } },
    addRowEmitter: { action: 'addRowEmitter', table: { disable: true } },
    /** === Control Hide === */
    // someControl: { table: { disable: true } }
    /** === Control Disable === */
    // someControl: { control: { disable: true } }
  },
  args: {
    data: MOCK_Expense_Array,
    columns: MOCK_ColDef_Expense,
    striped: true,
  },
};
export default meta;

export const SimpleTable: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
