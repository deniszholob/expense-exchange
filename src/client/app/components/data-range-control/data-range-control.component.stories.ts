// #region Imports
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DateRangePreset } from 'src/client/app/shared/date-range/date-range-preset.enum';
import type { DateRange } from 'src/client/app/shared/date-range/date-range.model';
import { createDateRangeForPreset } from 'src/client/app/shared/date-range/date-range.util';
import { DataRangeControlComponent } from './data-range-control.component';
// #endregion

// #region Stories
const dataRange = signal<DateRange>(
  createDateRangeForPreset(DateRangePreset.AllTime),
);

const meta: Meta<DataRangeControlComponent> = {
  component: DataRangeControlComponent,
  parameters: {
    docs: {
      description: {
        component:
          'Global data-range control with a collapsed-by-default panel for year, month, and date-bound selection.',
      },
    },
  },
};
export default meta;

export const DataRangeControl: StoryObj<DataRangeControlComponent> = {
  render: () => ({
    props: { dataRange },
    template: `
      <div class="flex justify-end p-6">
        <app-data-range-control
          [$earliestDate]="'2020-06-15'"
          [($dataRange)]="dataRange"
        />
      </div>
    `,
  }),
};
// #endregion
