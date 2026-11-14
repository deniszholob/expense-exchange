// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import { Meta, StoryObj } from '@storybook/angular-vite';

import { PageLayoutComponent } from './page-layout.component';
// #endregion

// #region Implementation

type ComponentWithCustomControls = PageLayoutComponent; // & {};

const meta: Meta<ComponentWithCustomControls> = {
  // title: 'Layout/Page Layout',
  component: PageLayoutComponent,
  // decorators: [moduleMetadata({ imports: [] }), applicationConfig({ providers: [ importProvidersFrom() ]})],
  parameters: {
    docs: { description: { component: `PageLayout` } },
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
  args: {
    $fillHeight: false,
  },
};
export default meta;

export const PageLayout: StoryObj<ComponentWithCustomControls> = {
  render: (args) => ({
    props: args,
    template: `
      <app-page-layout [$fillHeight]="$fillHeight">
      <section class="section-container surface-card p-5">
          <h2 class="font-semibold">Page content</h2>
          <p class="text-finance-muted mt-2 text-sm">Page layouts span the available width; sections can set their own limits.</p>
        </section>
      </app-page-layout>
    `,
  }),
  // play: async ({ canvasElement }) => { const canvasElement = within(canvasElement) },
};

// #endregion
