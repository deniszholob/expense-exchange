// #region Imports
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DateRangePreset } from 'src/client/app/shared/date-range/date-range-preset.enum';
import type { DateRange } from 'src/client/app/shared/date-range/date-range.model';
import { createDateRangeForPreset } from 'src/client/app/shared/date-range/date-range.util';
import { DataRangePanelComponent } from './data-range-panel.component';
// #endregion

// #region Stories
const dataRange = signal<DateRange>(
  createDateRangeForPreset(DateRangePreset.Month),
);

const meta: Meta<DataRangePanelComponent> = {
  component: DataRangePanelComponent,
  parameters: {
    docs: {
      description: {
        component:
          'Reusable data-range panel with quick selections, year and month controls, and editable date bounds.',
      },
    },
  },
};
export default meta;

export const DataRangePanel: StoryObj<DataRangePanelComponent> = {
  render: () => ({
    props: { dataRange },
    template: `
      <div class="mx-auto w-full max-w-3xl">
        <app-data-range-panel
          [$panelId]="'data-range-panel-story'"
          [$idPrefix]="'data-range-story'"
          [$earliestDate]="'2020-06-15'"
          [($range)]="dataRange"
        />
      </div>
    `,
  }),
};
// #endregion
