import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  host: { class: 'contents' },
})
export class FormFieldComponent {
  public readonly $id = input.required<string>();
  public readonly $label = input.required<string>();
  public readonly $required = input(false);
}
