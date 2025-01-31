// @ref https://storybook.js.org/docs/writing-stories
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular';
import { StoryFnAngularReturnType } from '@storybook/angular/dist/client/types';

import { SettingsPageComponent } from './settings-page.component';
import { importProvidersFrom } from '@angular/core';
import { MOCK_ExpenseServiceProvider } from 'src/app/api';

type ComponentWithCustomControls = SettingsPageComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Pages/Settings Page',
  component: SettingsPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_ExpenseServiceProvider],
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
  render: (args): StoryFnAngularReturnType => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};
