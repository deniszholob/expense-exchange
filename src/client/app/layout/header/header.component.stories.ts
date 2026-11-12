// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular';

import { importProvidersFrom } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { MOCK_ExpenseApiProvider } from 'src/client/app/expense-api.mock';
import { MOCK_Router } from 'src/client/app/app.routes.mock';
// #endregion

// #region Implementation

type ComponentWithCustomControls = HeaderComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Layout/Header',
  component: HeaderComponent,
  decorators: [
    moduleMetadata({
      imports: [RouterModule],
      providers: [
        {
          provide: Router,
          useValue: MOCK_Router,
        },
      ],
    }),
    applicationConfig({
      providers: [
        importProvidersFrom(),
        MOCK_ExpenseApiProvider,
        // { provide: Router, useValue: mockRouter },
        // provideRouter([
        //   { path: '', component: TestComponent },
        //   { path: 'some-route', component: TestComponent },
        // ]),
      ],
    }),
  ],
  parameters: {
    docs: { description: { component: `Header` } },
    layout: 'fullscreen',
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
  args: {
    // links: MOCK_Link_Array,
  },
};
export default meta;

export const Header: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
