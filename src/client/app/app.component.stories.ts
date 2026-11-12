import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular';
import { AppComponent } from './app.component';
import { Router, RouterModule } from '@angular/router';
import { MOCK_Router } from './app.routes.mock';
import { importProvidersFrom } from '@angular/core';
import { MOCK_ExpenseApiProvider } from './expense-api.mock';

type ComponentWithCustomControls = AppComponent;

const meta: Meta<ComponentWithCustomControls> = {
  title: 'App',
  component: AppComponent,
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
      providers: [importProvidersFrom(), MOCK_ExpenseApiProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `App` } },
    // layout: 'fullscreen',
  },
  argTypes: {
    // Output
    // inputChange: { action: 'inputChange', table: { disable: true } }
    // Hide
    // someControl: { table: { disable: true } }
  },
  args: {},
};
export default meta;

export const App: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({ props: args }),
};
