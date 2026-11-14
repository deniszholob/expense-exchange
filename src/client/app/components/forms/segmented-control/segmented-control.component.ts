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
export interface SegmentedControlOption<
  TValue extends string | boolean = string,
> {
  readonly value: TValue;
  readonly label: string;
  readonly disabled?: boolean;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.component.html',
  host: { class: 'contents' },
})
export class SegmentedControlComponent<
  TValue extends string | boolean = string,
> implements FormValueControl<TValue> {
  public readonly value = model.required<TValue>();
  public readonly $options =
    input.required<readonly SegmentedControlOption<TValue>[]>();
  public readonly $label = input.required<string>();
  public readonly $stretch = input(false);
}
// #endregion
