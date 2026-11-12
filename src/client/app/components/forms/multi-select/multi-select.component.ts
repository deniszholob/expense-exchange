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
export interface MultiSelectOption {
  readonly id: string;
  readonly name: string;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  host: { class: 'block' },
})
export class MultiSelectComponent implements FormValueControl<string[]> {
  public readonly value = model.required<string[]>();
  public readonly $options = input.required<MultiSelectOption[]>();

  protected toggle(id: string, event: Event): void {
    const checked =
      event.target instanceof HTMLInputElement && event.target.checked;
    const selected = this.value();
    this.value.set(
      checked
        ? [...new Set([...selected, id])]
        : selected.filter((value) => value !== id),
    );
  }
}
// #endregion
