import { FormControl, FormGroup } from '@angular/forms';
import { delay, Observable, throwError } from 'rxjs';

/** Storybook calls Json.stringify on all props to display in docs
 * FormControl has circular json structure which causes an error
 * This adds an override json function that just returns null
 * @ref https://github.com/storybookjs/storybook/issues/16855#issuecomment-1900540330
 * @usage {args: {control: new StorybookFormControl() }}
 */
export class StorybookFormControl extends FormControl {
  public toJSON(): null {
    return null;
  }
}

/** Storybook calls Json.stringify on all props to display in docs
 * FormControl has circular json structure which causes an error
 * This adds an override json function that just returns null
 * @ref https://github.com/storybookjs/storybook/issues/16855#issuecomment-1900540330
 * @usage {args: {group: new StorybookFormGroup() }}
 */
export class StorybookFormGroup extends FormGroup {
  public toJSON(): null {
    return null;
  }
}

export function addDelay<T>(
  obs$: Observable<T>,
  time: number = 500,
): Observable<T> {
  return obs$.pipe(delay(time));
}

export function addError<T>(
  obs$?: Observable<T>,
  isError: boolean = false,
): Observable<T> {
  if (isError || !obs$) {
    return throwError((): Error => new Error('Test error'));
  }
  return obs$;
}
