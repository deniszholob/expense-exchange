// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DataRangeTriggerComponent } from './data-range-trigger.component';
// #endregion

// #region Stories
const meta: Meta<DataRangeTriggerComponent> = {
  component: DataRangeTriggerComponent,
  argTypes: {
    toggleRequested: { action: 'toggle requested' },
  },
  args: {
    $label: 'November 2026',
    $panelId: 'data-range-trigger-story-panel',
  },
};
export default meta;

export const Closed: StoryObj<DataRangeTriggerComponent> = {
  args: { $expanded: false },
};

export const Open: StoryObj<DataRangeTriggerComponent> = {
  args: { $expanded: true },
};
// #endregion
