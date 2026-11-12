// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SegmentedControlComponent } from './segmented-control.component';
// #endregion

// #region Stories
const meta: Meta<SegmentedControlComponent> = {
  component: SegmentedControlComponent,
  decorators: [moduleMetadata({ imports: [SegmentedControlComponent] })],
  args: {
    $label: 'Transaction type',
    $options: [
      { value: 'Expense', label: 'Expense' },
      { value: 'Income', label: 'Income' },
      { value: 'All', label: 'All' },
    ],
  },
};
export default meta;

export const TypeFilter: StoryObj<SegmentedControlComponent> = {
  render: (args) => ({
    props: { ...args, value: 'All' },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [(value)]="value" />',
  }),
};

export const GroupScope: StoryObj<SegmentedControlComponent> = {
  args: {
    $label: 'Transaction scope',
    $options: [
      { value: 'Group', label: 'Group' },
      { value: 'MyShare', label: 'My share' },
    ],
  },
  render: (args) => ({
    props: { ...args, value: 'Group' },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [(value)]="value" />',
  }),
};

export const FullWidth: StoryObj<SegmentedControlComponent> = {
  args: {
    $stretch: true,
  },
  render: (args) => ({
    props: { ...args, value: 'All' },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [$stretch]="$stretch" [(value)]="value" />',
  }),
};
// #endregion
