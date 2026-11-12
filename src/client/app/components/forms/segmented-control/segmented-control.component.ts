// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
// #endregion

// #region Types
export interface SegmentedControlOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.component.html',
  host: { class: 'block' },
})
export class SegmentedControlComponent implements FormValueControl<string> {
  public readonly value = model.required<string>();
  public readonly $options =
    input.required<readonly SegmentedControlOption[]>();
  public readonly $label = input.required<string>();
  public readonly $stretch = input(false);
}
// #endregion
