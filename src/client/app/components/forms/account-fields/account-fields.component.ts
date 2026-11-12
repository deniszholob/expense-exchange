// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type Field } from '@angular/forms/signals';
import { FormFieldComponent } from '../form-field/form-field.component';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-account-fields',
  templateUrl: './account-fields.component.html',
  imports: [FormField, FormFieldComponent],
})
export class AccountFieldsComponent {
  public readonly $idPrefix = input.required<string>();
  public readonly $nameField = input.required<Field<string>>();
  public readonly $usernameField = input.required<Field<string>>();
  public readonly $passwordField = input.required<Field<string>>();
  public readonly $passwordLabel = input.required<string>();
  public readonly $passwordPlaceholder = input('');
  public readonly $passwordRequired = input(false);
}
// #endregion
