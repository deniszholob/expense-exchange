import { CommonModule } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';

import { FormField } from './form-field.model';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  host: { class: 'contents' },
  imports: [CommonModule],
})
export class FormFieldComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}

  public readonly formField: InputSignal<FormField> =
    input.required<FormField>();
}
