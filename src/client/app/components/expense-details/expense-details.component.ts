// #region Imports
import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  InputSignal,
  linkedSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import {
  FormField,
  form,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { LucideCheck } from '@lucide/angular';
import {
  ExpenseDto,
  GroupMemberDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { MultiSelectComponent } from '../forms/multi-select/multi-select.component';
// #endregion

// #region Constants
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
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-expense-details',
  templateUrl: './expense-details.component.html',
  imports: [
    CommonModule,
    FormField,
    FormFieldComponent,
    LucideCheck,
    MultiSelectComponent,
  ],
})
export class ExpenseDetailsComponent {
  public readonly currentUser: InputSignal<GroupMemberDto | undefined> =
    input<GroupMemberDto>();
  public readonly groupMembers: InputSignal<GroupMemberDto[]> =
    input.required<GroupMemberDto[]>();
  public readonly expense: InputSignal<ExpenseDto | undefined> =
    input<ExpenseDto>();
  public readonly save: OutputEmitterRef<ExpenseDto> = output<ExpenseDto>();
  public readonly cancelRequested: OutputEmitterRef<void> = output<void>();

  private readonly $expenseData = linkedSignal(() => {
    const groupMembers = this.groupMembers();
    const expense = this.expense();
    if (expense)
      return { ...expense, paidForUserIds: [...expense.paidForUserIds] };
    const date = new Date().toISOString().slice(0, 10);
    return {
      ...NEW_EXPENSE,
      datePaid: date,
      forDate: date,
      paidByUserId: (this.currentUser() ?? groupMembers[0])?.id ?? '',
      paidForUserIds: groupMembers.map((member) => member.id),
    };
  });
  protected readonly $form = form(this.$expenseData, (path) => {
    required(path.name);
    minLength(path.name, 3);
    required(path.amount);
    min(path.amount, 0.01);
    required(path.datePaid);
    required(path.forDate);
    required(path.paidByUserId);
    required(path.paidForUserIds);
    minLength(path.paidForUserIds, 1);
  });

  protected onSaveExpense(event: Event): void {
    event.preventDefault();
    if (this.$form().invalid()) return;
    this.save.emit(this.$expenseData());
  }

  protected onCancel(): void {
    this.cancelRequested.emit();
  }
}
// #endregion
