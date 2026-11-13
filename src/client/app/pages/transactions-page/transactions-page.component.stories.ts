// @ref https://storybook.js.org/docs/writing-stories
import {
  applicationConfig,
  Meta,
  moduleMetadata,
  StoryObj,
} from '@storybook/angular-vite';

import { TransactionsPageComponent } from './transactions-page.component';
import { importProvidersFrom } from '@angular/core';
import {
  getMockActivatedRouteProvider,
  getMockRouteParamsDetailPage,
  MockDetailsPageParamsEnum,
  MockDetailsPageParamsEnumMap,
  SB_InputMap_routeParams,
  SbWithDetailsPageParamsControl,
} from 'src/client/app/layout';
import { MOCK_TransactionApiProvider } from 'src/client/api/mocks/transaction-api.mock';

type ComponentWithCustomControls = TransactionsPageComponent &
  SbWithDetailsPageParamsControl;

const MOCK_RouteParams_DetailPage: MockDetailsPageParamsEnumMap =
  getMockRouteParamsDetailPage();

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Pages/Transactions Page',
  component: TransactionsPageComponent,
  decorators: [
    moduleMetadata({ imports: [] }),
    applicationConfig({
      providers: [importProvidersFrom(), MOCK_TransactionApiProvider],
    }),
  ],
  parameters: {
    docs: { description: { component: `TransactionsPage` } },
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

export const TransactionsPage: StoryObj<ComponentWithCustomControls> = {
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
