import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { typedNullCheck } from 'src/app/utils';

import { DisplayOption } from './display-option/display-option.model';

export function singleSelectFieldValidator(
  validItems?: string[] | DisplayOption[],
  validationProperty: keyof DisplayOption = 'id',
): ValidatorFn {
  return (
    control: AbstractControl<string | DisplayOption>,
  ): ValidationErrors | null => {
    // If input field is null, skip this validator and use required validator instead
    if (!control.value) return null;
    if (!validItems) return null;

    const validationErrors: ValidationErrors = {
      selectFieldValidator: control.value,
    };

    const value: string =
      typeof control.value === 'string'
        ? control.value
        : control.value[validationProperty];

    const isValid: boolean = validItems
      .map((value: string | DisplayOption): string =>
        typeof value === 'string' ? value : value[validationProperty],
      )
      .filter(typedNullCheck)
      .map((value: string): string => value.toLocaleLowerCase())
      .includes(value.toLocaleLowerCase());

    return isValid ? null : validationErrors;
  };
}
