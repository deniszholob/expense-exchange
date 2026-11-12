import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { LucideX } from '@lucide/angular';

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  imports: [LucideX],
  host: { class: 'contents' },
})
export class FormFieldComponent {
  public readonly $id = input.required<string>();
  public readonly $label = input.required<string>();
  public readonly $required = input(false);
  public readonly $value = input<unknown>();
  public readonly clearRequested = output<void>();

  private readonly $formField = contentChild<FormField<unknown>>(FormField);
  protected readonly $hasValue = computed(() => {
    const externalValue = this.$value();
    const fieldValue =
      externalValue !== undefined
        ? externalValue
        : this.$formField()?.state().controlValue();
    return hasClearableValue(fieldValue);
  });

  protected clearValue(): void {
    if (this.$value() !== undefined) {
      this.clearRequested.emit();
      return;
    }
    const state = this.$formField()?.state();
    if (!state) return;
    state.controlValue.set(emptyFieldValue(state.controlValue()));
    state.markAsDirty();
  }
}
// #endregion

// #region Helpers
function hasClearableValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '' || value === false)
    return false;
  return !Array.isArray(value) || value.length > 0;
}

function emptyFieldValue(value: unknown): unknown {
  if (typeof value === 'string') return '';
  if (typeof value === 'number' || value instanceof Date) return null;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return [];
  return null;
}
// #endregion
