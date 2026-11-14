// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  signal,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  formatDateInputForDisplay,
  normalizeDateInput,
} from 'src/client/app/shared/date-input.util';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  host: { class: 'contents' },
})
export class DateInputComponent implements FormValueControl<string> {
  public readonly value = model.required<string>();
  public readonly $id = input.required<string>();
  public readonly $min = input<string>();
  public readonly $max = input<string>();

  protected readonly $text = signal('');
  protected readonly $invalidInput = signal(false);
  protected readonly $nativeValue = computed(
    () => normalizeDateInput(this.value()) ?? '',
  );

  private lastSyncedValue = '';

  public constructor() {
    effect(() => {
      const value = this.value();
      if (value === this.lastSyncedValue) return;
      this.lastSyncedValue = value;
      if (!this.$invalidInput())
        this.$text.set(formatDateInputForDisplay(value));
    });
  }

  protected updateText(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const enteredValue = input.value;
    const normalizedValue = normalizeDateInput(enteredValue);
    this.$invalidInput.set(Boolean(enteredValue) && !normalizedValue);
    this.value.set(normalizedValue ?? '');
    this.$text.set(
      normalizedValue
        ? formatDateInputForDisplay(normalizedValue)
        : enteredValue,
    );
  }

  protected updateFromPicker(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    this.$invalidInput.set(false);
    this.value.set(input.value);
    this.$text.set(formatDateInputForDisplay(input.value));
  }

  protected openPickerOnEmptySpace(
    event: MouseEvent,
    picker: HTMLInputElement,
  ): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const clickX = event.clientX - input.getBoundingClientRect().left;
    const textWidth =
      this.$text().length *
      Number.parseFloat(getComputedStyle(input).fontSize) *
      0.55;
    if (this.$text() && clickX <= 12 + textWidth) return;
    if (!this.$text() && clickX < 24) return;
    if (typeof picker.showPicker !== 'function') return;
    event.preventDefault();
    picker.showPicker();
  }
}
// #endregion
