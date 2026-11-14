// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { LucidePencil, LucideTrash2 } from '@lucide/angular';
import { RecurringPageComponent } from './recurring-page.component';
// #endregion

// #region Stories
const meta: Meta<RecurringPageComponent> = {
  component: RecurringPageComponent,
  title: 'Pages/Recurring rules',
  decorators: [moduleMetadata({ imports: [LucidePencil, LucideTrash2] })],
  parameters: {
    docs: {
      description: {
        component:
          'The table is the current rules view. The previous card design is retained below as a visual reference.',
      },
    },
  },
};
export default meta;

export const PreviousCardDesignReference: StoryObj<RecurringPageComponent> = {
  render: () => ({
    template: `
      <section class="surface-card flex flex-col gap-4 p-5 sm:p-6" aria-label="Previous recurring rule card design">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-semibold">Amazon Prime</h2>
              <span class="transaction-type-badge transaction-type-badge-expense">Expense</span>
            </div>
            <p class="text-finance-muted mt-1 text-xs">Active from 2024-09-01</p>
          </div>
          <div class="flex shrink-0 justify-end gap-1">
            <button class="btn-icon btn-icon-edit rounded-control" aria-label="Edit Amazon Prime" type="button">
              <svg class="size-4" lucidePencil aria-hidden="true"></svg>
            </button>
            <button class="btn-icon btn-icon-delete rounded-control" aria-label="End Amazon Prime" type="button">
              <svg class="size-4" lucideTrash2 aria-hidden="true"></svg>
            </button>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-control border-finance-border bg-finance-surface border p-3">
            <dt class="text-finance-muted text-xs">Prices</dt>
            <dd class="mt-1 font-medium tabular-nums">2024-09-01 · $140.00</dd>
          </div>
          <div class="rounded-control border-finance-border bg-finance-surface border p-3">
            <dt class="text-finance-muted text-xs">Schedule</dt>
            <dd class="mt-1 font-medium">Yearly</dd>
          </div>
          <div class="rounded-control border-finance-border bg-finance-surface border p-3">
            <dt class="text-finance-muted text-xs">Paid by</dt>
            <dd class="mt-1 font-medium">Alice</dd>
            <dd class="text-finance-muted mt-1 text-xs">Autopay</dd>
          </div>
          <div class="rounded-control border-finance-border bg-finance-surface border p-3">
            <dt class="text-finance-muted text-xs">Affects</dt>
            <dd class="mt-2 flex flex-wrap gap-1.5">
              <span class="participant-badge">Alice</span>
              <span class="participant-badge">Bob</span>
            </dd>
          </div>
        </dl>
      </section>
    `,
  }),
};
// #endregion
