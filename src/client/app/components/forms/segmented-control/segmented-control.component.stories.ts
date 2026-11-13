// #region Imports
import { moduleMetadata } from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  TransactionScope,
  TRANSACTION_SCOPE_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-scope.enum';
import {
  TransactionListFilter,
  TRANSACTION_LIST_FILTER_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-list-filter.enum';
import { SegmentedControlComponent } from './segmented-control.component';
// #endregion

// #region Stories
const meta: Meta<SegmentedControlComponent> = {
  component: SegmentedControlComponent,
  decorators: [moduleMetadata({ imports: [SegmentedControlComponent] })],
  args: {
    $label: 'Transaction type',
    $options: TRANSACTION_LIST_FILTER_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
    })),
  },
};
export default meta;

export const TypeFilter: StoryObj<SegmentedControlComponent> = {
  render: (args) => ({
    props: { ...args, value: TransactionListFilter.All },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [(value)]="value" />',
  }),
};

export const GroupScope: StoryObj<SegmentedControlComponent> = {
  args: {
    $label: 'Transaction scope',
    $options: TRANSACTION_SCOPE_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
    })),
  },
  render: (args) => ({
    props: { ...args, value: TransactionScope.Group },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [(value)]="value" />',
  }),
};

export const FullWidth: StoryObj<SegmentedControlComponent> = {
  args: {
    $stretch: true,
  },
  render: (args) => ({
    props: { ...args, value: TransactionListFilter.All },
    template:
      '<app-segmented-control [$options]="$options" [$label]="$label" [$stretch]="$stretch" [(value)]="value" />',
  }),
};
// #endregion
