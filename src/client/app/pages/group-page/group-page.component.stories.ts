// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular-vite';

import { GroupPageComponent } from './group-page.component';
import { importProvidersFrom } from '@angular/core';
import { MOCK_TransactionApiProvider } from 'src/client/api/mocks/transaction-api.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = GroupPageComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Pages/Users Page',
  component: GroupPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_TransactionApiProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `GroupPage` } },
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
  args: {},
};
export default meta;

export const GroupPage: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
