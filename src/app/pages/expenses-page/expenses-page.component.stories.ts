// @ref https://storybook.js.org/docs/writing-stories
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular';

import { ExpensesPageComponent } from './expenses-page.component';
import { importProvidersFrom } from '@angular/core';
import {
  getMockActivatedRouteProvider,
  getMockRouteParamsDetailPage,
  MockDetailsPageParamsEnum,
  MockDetailsPageParamsEnumMap,
  SB_InputMap_routeParams,
  SbWithDetailsPageParamsControl,
} from 'src/app/layout';
import { MOCK_ExpenseServiceProvider } from 'src/app/api';

type ComponentWithCustomControls = ExpensesPageComponent &
  SbWithDetailsPageParamsControl;

const MOCK_RouteParams_DetailPage: MockDetailsPageParamsEnumMap =
  getMockRouteParamsDetailPage();

const meta: Meta<ComponentWithCustomControls> = {
  title: 'Pages/Expenses Page',
  component: ExpensesPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_ExpenseServiceProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `ExpensesPage` } },
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
    routeParams: SB_InputMap_routeParams,
  },
  args: {
    routeParams: MockDetailsPageParamsEnum.None,
  },
};
export default meta;

// Saved value needed b/c storybook seems to cache the providers in the custom render function
let cacheRouteParams: MockDetailsPageParamsEnum =
  MockDetailsPageParamsEnum.None;

export const ExpensesPage: StoryObj<ComponentWithCustomControls> = {
  render: (args) => {
    cacheRouteParams = args.routeParams;

    return {
      props: args,
      moduleMetadata: {
        providers: [
          getMockActivatedRouteProvider(
            MOCK_RouteParams_DetailPage,
            cacheRouteParams,
          ),
        ],
      },
    };
  },
};
