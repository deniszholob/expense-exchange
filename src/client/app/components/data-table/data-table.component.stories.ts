// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import {
  componentWrapperDecorator,
  moduleMetadata,
} from '@storybook/angular-vite';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import type { ColDef, TableBaseData } from './data-table.model';
import { DataTableComponent } from './data-table.component';
// #endregion

// #region Story Data
interface ExampleRow extends TableBaseData {
  readonly name: string;
  readonly amount: number;
  readonly status: string;
  readonly labels: readonly string[];
}

const MOCK_ExampleRow_Array: readonly ExampleRow[] = Array.from(
  { length: 12 },
  (_, index): ExampleRow => ({
    id: `item-${index + 1}`,
    name: `Example ${index + 1}`,
    amount: (index + 1) * 8.25,
    status: index % 3 === 0 ? 'Open' : 'Closed',
    labels: index % 2 === 0 ? ['Personal', 'Monthly'] : ['Shared'],
  }),
);

const EXAMPLE_ROW_COLUMNS: readonly ColDef<ExampleRow>[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    headerClass: 'text-right',
    cellClass: 'text-right tabular-nums',
    valueFormatter: (value) => `$${Number(value).toFixed(2)}`,
  },
  { key: 'status', label: 'Status' },
  { key: 'labels', label: 'Labels' },
];

const FORMATTED_CELL_COLUMNS: readonly ColDef<ExampleRow>[] = [
  { key: 'name', label: 'Name' },
  {
    key: 'amount',
    label: 'Amount',
    headerClass: 'text-right',
    cellClass: 'text-right tabular-nums',
    valueFormatter: (value) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value)),
  },
  {
    key: 'status',
    label: 'Status',
    valueFormatter: (value) => String(value).toUpperCase(),
  },
];

type ComponentWithCustomControls = DataTableComponent<ExampleRow>;
// #endregion

// #region Stories
const meta: Meta<ComponentWithCustomControls> = {
  component: DataTableComponent,
  parameters: {
    docs: {
      description: {
        component:
          'A generic data table with configurable columns, cell templates, row actions, sorting, and pagination.',
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `
        <main class="flex h-dvh min-h-0 flex-col overflow-hidden p-6">
          ${story}
        </main>
      `,
    ),
  ],
  argTypes: {
    addRequested: { action: 'addRequested' },
    editRequested: { action: 'editRequested' },
    deleteRequested: { action: 'deleteRequested' },
  },
  args: {
    $data: MOCK_ExampleRow_Array,
    $columns: EXAMPLE_ROW_COLUMNS,
    $title: 'Example records',
    $caption: 'Example records',
    $addActionLabel: 'Add record',
    $emptyMessage: 'No example records.',
    $showAddAction: true,
    $showEditAction: true,
    $showDeleteAction: true,
    $striped: true,
  },
};
export default meta;

export const DataTable: StoryObj<ComponentWithCustomControls> = {};

export const FormattedCells: StoryObj<ComponentWithCustomControls> = {
  args: {
    $title: 'Formatted cells',
    $columns: FORMATTED_CELL_COLUMNS,
    $showAddAction: false,
    $showEditAction: false,
    $showDeleteAction: false,
  },
};

export const CustomCellRenderer: StoryObj<ComponentWithCustomControls> = {
  decorators: [moduleMetadata({ imports: [DataTableComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <ng-template #statusRenderer let-value="value">
        <span class="rounded-control border-finance-border inline-flex border px-2 py-1 text-xs text-sky-200">
          {{ value }}
        </span>
      </ng-template>
      <app-data-table
        [$data]="$data"
        [$columns]="[
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status', cellTemplate: statusRenderer },
        ]"
        [$title]="'Custom cell renderer'"
        [$showAddAction]="false"
        [$showEditAction]="false"
        [$showDeleteAction]="false"
      />
    `,
  }),
};

export const Empty: StoryObj<ComponentWithCustomControls> = {
  args: { $data: [] },
};

export const WithoutRowActions: StoryObj<ComponentWithCustomControls> = {
  args: {
    $showAddAction: false,
    $showEditAction: false,
    $showDeleteAction: false,
  },
};
// #endregion
