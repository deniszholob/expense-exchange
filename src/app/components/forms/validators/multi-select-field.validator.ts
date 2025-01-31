import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ArrayComparatorBool, arrayDifference } from 'src/app/utils';

import { DisplayOption } from './display-option/display-option.model';

export function multiSelectFieldValidator(
  validItems?: string[] | DisplayOption[],
  validationProperty: keyof DisplayOption = 'id',
): ValidatorFn {
  return (
    control: AbstractControl<string[] | DisplayOption[]>,
  ): ValidationErrors | null => {
    // If input field is null, skip this validator and use required validator instead
    if (!control.value) return null;
    if (!validItems) return null;

    const validationErrors: ValidationErrors = {
      multiSelectFieldValidator: control.value,
    };

    const invalidItems = Array.isArray(control.value)
      ? arrayDifference(
          control.value,
          validItems,
          getSelectionComparator(validationProperty),
        )
      : null;

    const isValid: boolean = invalidItems !== null && invalidItems.length <= 0;

    if (invalidItems !== null) {
      validationErrors['multiSelectFieldValidator'] = invalidItems;
    }

    return isValid ? null : validationErrors;
  };
}

function getSelectionComparator(
  key: keyof DisplayOption,
): ArrayComparatorBool<DisplayOption | string> {
  return (a: DisplayOption | string, b: DisplayOption | string): boolean => {
    if (typeof b === 'string') {
      return typeof a === 'string' ? b === a : b === a[key];
    }

    return typeof a === 'string' ? b[key] === a : b[key] === a[key];
  };
}
