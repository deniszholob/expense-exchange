import { AbstractControl } from '@angular/forms';

export interface FormField {
  id: string;
  label: string;
  formControl?: AbstractControl | null;
  // note: string;
}
