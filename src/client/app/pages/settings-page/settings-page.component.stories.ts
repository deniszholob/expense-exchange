// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular';

import { SettingsPageComponent } from './settings-page.component';
import { importProvidersFrom } from '@angular/core';
import { MOCK_ExpenseApiProvider } from 'src/client/app/expense-api.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = SettingsPageComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Pages/Settings Page',
  component: SettingsPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_ExpenseApiProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `SettingsPage` } },
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

export const SettingsPage: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
