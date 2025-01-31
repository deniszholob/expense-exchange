import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Expense, User, userComparatorBool } from 'src/app/api';

import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { multiSelectFieldValidator } from '../forms/validators/multi-select-field.validator';
import { singleSelectFieldValidator } from '../forms/validators/single-select-field.validator';

const NEW_EXPENSE: Expense = {
  id: '',
  name: '',
  description: '',
  amount: 0,
  datePaid: '',
  forDate: '',
  paidByUserId: '',
  paidForUserIds: [],
};

const ISO_DATE_TIME_REGEX =
  /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])\.[0-9]{3}Z$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-expense-details',
  templateUrl: './expense-details.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent],
})
export class ExpenseDetailsComponent {
  protected readonly userComparatorBool = userComparatorBool;

  public readonly users: InputSignal<User[]> = input.required<User[]>();
  public readonly expense: InputSignal<Expense | undefined> = input<Expense>();
  public readonly save: OutputEmitterRef<Expense> = output<Expense>();

  protected formGroup = this.formBuilder.group({
    id: [''],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    amount: [0, [Validators.required, Validators.min(1)]],
    datePaid: ['', [Validators.required, Validators.pattern(DATE_REGEX)]],
    forDate: ['', [Validators.required, Validators.pattern(DATE_REGEX)]],
    paidByUserId: ['', [Validators.required, Validators.minLength(1)]],
    paidForUserIds: [
      [] as string[],
      [Validators.required, Validators.minLength(1)],
    ],
  });

  constructor(private formBuilder: FormBuilder) {
    effect((): void => {
      const users: User[] = this.users();
      const expense: Expense | undefined = this.expense();

      let patchExpense: Partial<Expense> | undefined = expense;
      if (!patchExpense) {
        const date: string | undefined =
          new Date(Date.now()).toISOString().split('T')[0] ?? undefined;
        patchExpense = {
          ...NEW_EXPENSE,
          id: undefined,
          datePaid: date,
          forDate: date,
          paidByUserId: users.at(0)?.id,
          paidForUserIds: [...users.map((user: User): string => user.id)],
        };
      }

      this.formGroup = this.formBuilder.group({
        id: [''],
        name: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        amount: [0, [Validators.required, Validators.min(1)]],
        datePaid: ['', [Validators.required, Validators.pattern(DATE_REGEX)]],
        forDate: ['', [Validators.required, Validators.pattern(DATE_REGEX)]],
        paidByUserId: [
          '',
          [
            Validators.required,
            Validators.minLength(1),
            singleSelectFieldValidator(this.users().map((user) => user.id)),
          ],
        ],
        paidForUserIds: [
          [] as string[],
          [
            Validators.required,
            Validators.minLength(1),
            multiSelectFieldValidator(this.users().map((user) => user.id)),
          ],
        ],
      });

      this.formGroup.patchValue(patchExpense);
    });
  }

  protected onSaveExpense(): void {
    if (!this.formGroup.valid) {
      console.warn('Invalid form data:', this.formGroup.value);
      alert('Invalid form data');
      return;
    }

    const expenseData: Expense = this.formGroup.value as Expense;
    this.save.emit(expenseData);
  }
}
