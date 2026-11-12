// #region Imports
import { signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DateRangePreset } from '../../shared/date-range/date-range-preset.enum';
import type { DateRange } from '../../shared/date-range/date-range.model';
import { createDateRangeForPreset } from '../../shared/date-range/date-range.util';
import { DateRangeSelectorComponent } from './date-range-selector.component';
// #endregion

// #region Stories
const dateRange = signal<DateRange>(
  createDateRangeForPreset(DateRangePreset.Month),
);

const meta: Meta<DateRangeSelectorComponent> = {
  component: DateRangeSelectorComponent,
  parameters: {
    docs: {
      description: {
        component:
          'Reusable date-range filter with all-time, current-month, and current-year presets plus editable date bounds.',
      },
    },
  },
};
export default meta;

export const DateRangeSelector: StoryObj<DateRangeSelectorComponent> = {
  render: () => ({
    props: { dateRange },
    template: `
      <div class="surface-card mx-auto w-full max-w-3xl p-5">
        <app-date-range-selector
          [$idPrefix]="'date-range-story'"
          [$earliestExpenseDate]="'2020-06-15'"
          [($range)]="dateRange"
        />
      </div>
    `,
  }),
};
// #endregion
