import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChild,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { LucideEye, LucideEyeOff, LucideX } from '@lucide/angular';

// #region Constants
const SELECTABLE_INPUT_TYPES: ReadonlySet<string> = new Set([
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'url',
]);
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  imports: [LucideEye, LucideEyeOff, LucideX],
  host: {
    class: 'contents',
    '(click)': 'onControlClick($event)',
  },
})
export class FormFieldComponent {
  public readonly $id = input.required<string>();
  public readonly $label = input.required<string>();
  public readonly $required = input(false);
  public readonly $value = input<unknown>();
  public readonly clearRequested = output<void>();

  private readonly $formField = contentChild<FormField<unknown>>(FormField);
  private readonly $projectedElement =
    contentChild<ElementRef<HTMLElement>>(ElementRef);
  protected readonly $passwordVisible = signal(false);
  protected readonly $passwordInput = computed(() => {
    const formElement = this.$formField()?.element;
    const projectedElement = this.$projectedElement()?.nativeElement;
    const element = formElement ?? projectedElement;
    if (!(element instanceof HTMLInputElement)) return undefined;
    if (element.type === 'password' || this.$passwordVisible()) return element;
    return undefined;
  });
  protected readonly $hasValue = computed(() => {
    const externalValue = this.$value();
    const fieldValue =
      externalValue !== undefined
        ? externalValue
        : this.$formField()?.state().controlValue();
    return hasClearableValue(fieldValue);
  });

  protected onControlClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) {
      target.select();
      return;
    }

    if (!(target instanceof HTMLInputElement)) return;

    if (SELECTABLE_INPUT_TYPES.has(target.type)) {
      target.select();
      return;
    }

    if (target.type !== 'date' || typeof target.showPicker !== 'function')
      return;

    const clickX = event.clientX - target.getBoundingClientRect().left;
    const dateSegmentRegion =
      Number.parseFloat(getComputedStyle(target).fontSize) * 10;
    if (target.value.length > 0 && clickX <= dateSegmentRegion) return;

    event.preventDefault();
    target.showPicker();
  }

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

  protected togglePasswordVisibility(): void {
    const input = this.$passwordInput();
    if (!input) return;
    const passwordVisible = !this.$passwordVisible();
    input.type = passwordVisible ? 'text' : 'password';
    this.$passwordVisible.set(passwordVisible);
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
