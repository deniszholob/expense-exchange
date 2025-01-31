// @ref https://storybook.js.org/docs/writing-stories
import { Meta, StoryObj } from '@storybook/angular';
import { StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';

import { SimpleTableComponent } from './simple-table.component';
import { Expense, MOCK_Expense_Array } from 'src/app/api';
import { MOCK_ColDef_Expense } from './simple-table.mock';

type ComponentWithCustomControls = SimpleTableComponent<Expense>; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Components/Simple Table',
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
  render: (args): StoryFnAngularReturnType => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};
