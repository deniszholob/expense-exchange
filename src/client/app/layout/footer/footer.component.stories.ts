// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';

import { FooterComponent } from './footer.component';
// #endregion

// #region Stories
const meta: Meta<FooterComponent> = {
  component: FooterComponent,
  parameters: {
    docs: {
      description: {
        component:
          'Application footer with project, support, and connection links.',
      },
    },
  },
};
export default meta;

export const Footer: StoryObj<FooterComponent> = {};
// #endregion
