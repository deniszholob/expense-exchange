// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { LucideCalendarDays } from '@lucide/angular';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-range-trigger',
  templateUrl: './data-range-trigger.component.html',
  host: { class: 'contents' },
  imports: [LucideCalendarDays],
})
export class DataRangeTriggerComponent {
  public readonly $label = input.required<string>();
  public readonly $expanded = input(false);
  public readonly $panelId = input.required<string>();
  public readonly toggleRequested = output<void>();
}
// #endregion
