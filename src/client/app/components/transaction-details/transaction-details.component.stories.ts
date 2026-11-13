// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import { Meta, StoryObj } from '@storybook/angular';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';

import { TransactionDetailsComponent } from './transaction-details.component';
import {
  MOCK_GroupMember_Array,
  MOCK_Transaction,
} from 'src/client/api/mocks/transaction-api.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = TransactionDetailsComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  component: TransactionDetailsComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `TransactionDetails` } },
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
    groupMembers: MOCK_GroupMember_Array,
    expenses: [MOCK_Transaction],
    transaction: MOCK_Transaction,
    initialType: TransactionType.Expense,
  },
};
export default meta;

export const NewTransaction: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

export const EditTransaction: StoryObj<ComponentWithCustomControls> = {
  args: { transaction: MOCK_Transaction },
  render: (args) => ({ props: args }),
};

// #endregion
