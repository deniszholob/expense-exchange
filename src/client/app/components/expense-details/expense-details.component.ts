// #region Imports
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
import {
  ExpenseDto,
  UserDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { userComparatorBool } from 'src/client/app/shared/user.util';

import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { multiSelectFieldValidator } from '../forms/validators/multi-select-field.validator';
import { singleSelectFieldValidator } from '../forms/validators/single-select-field.validator';
// #endregion

// #region Implementation

const NEW_EXPENSE: ExpenseDto = {
  id: '',
  name: '',
  description: '',
  amount: 0,
  datePaid: '',
  forDate: '',
  paidByUserId: '',
  paidForUserIds: [],
};

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

  public readonly currentUser: InputSignal<UserDto | undefined> =
    input<UserDto>();
  public readonly users: InputSignal<UserDto[]> = input.required<UserDto[]>();
  public readonly expense: InputSignal<ExpenseDto | undefined> =
    input<ExpenseDto>();
  public readonly save: OutputEmitterRef<ExpenseDto> = output<ExpenseDto>();

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

  public constructor(private formBuilder: FormBuilder) {
    effect((): void => {
      const users: UserDto[] = this.users();
      const expense: ExpenseDto | undefined = this.expense();

      let patchExpense: Partial<ExpenseDto> | undefined = expense;
      if (!patchExpense) {
        const date: string | undefined =
          new Date(Date.now()).toISOString().split('T').at(0) ?? undefined;
        patchExpense = {
          ...NEW_EXPENSE,
          id: undefined,
          datePaid: date,
          forDate: date,
          paidByUserId: (this.currentUser() ?? users.at(0))?.id,
          paidForUserIds: [...users.map((user: UserDto): string => user.id)],
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

    const expenseData: ExpenseDto = this.formGroup.value as ExpenseDto;
    this.save.emit(expenseData);
  }
}

// #endregion
