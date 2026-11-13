// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular-vite';

import { DashboardPageComponent } from './dashboard-page.component';
import { importProvidersFrom } from '@angular/core';
import { MOCK_TransactionApiProvider } from 'src/client/api/mocks/transaction-api.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = DashboardPageComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Pages/Dashboard Page',
  component: DashboardPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_TransactionApiProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `DashboardPage` } },
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

export const DashboardPage: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
