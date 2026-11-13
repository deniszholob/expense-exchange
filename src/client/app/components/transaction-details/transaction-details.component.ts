// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  FormField,
  form,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { LucideCheck } from '@lucide/angular';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  GroupMemberDto,
  CreateTransactionDto,
  TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { FormFieldComponent } from '../forms/form-field/form-field.component';
import { MultiSelectComponent } from '../forms/multi-select/multi-select.component';
import { SegmentedControlComponent } from '../forms/segmented-control/segmented-control.component';
import { TRANSACTION_TYPE_INFO_OPTIONS } from 'src/client/app/shared/transaction-type.info';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    FormField,
    FormFieldComponent,
    LucideCheck,
    MultiSelectComponent,
    SegmentedControlComponent,
  ],
})
export class TransactionDetailsComponent {
  public readonly currentUser = input<GroupMemberDto>();
  public readonly groupMembers = input.required<GroupMemberDto[]>();
  public readonly transaction = input<TransactionDto>();
  public readonly expenses = input<TransactionDto[]>([]);
  public readonly initialType = input<TransactionType>(TransactionType.Expense);
  public readonly save = output<CreateTransactionDto>();
  public readonly cancelRequested = output<void>();

  protected readonly TransactionType = TransactionType;
  protected readonly $isEditing = computed(
    () => this.transaction() !== undefined,
  );
  protected readonly $typeOptions = computed(() =>
    TRANSACTION_TYPE_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
      disabled: this.$isEditing(),
    })),
  );
  protected readonly $isExpense = computed(
    () => this.$transactionData().type === TransactionType.Expense,
  );
  protected readonly $isRefund = computed(
    () => this.$transactionData().type === TransactionType.Refund,
  );
  protected readonly $shareOptions = computed(() => {
    return this.groupMembers();
  });
  protected readonly $transactionData = linkedSignal(() => {
    const transaction = this.transaction();
    const members = this.groupMembers();
    const today = new Date().toISOString().slice(0, 10);
    const defaultUserId = this.currentUser()?.id ?? members[0]?.id ?? '';

    if (transaction)
      return {
        type: transaction.type,
        amount: transaction.amount,
        name: transaction.name,
        postDate: transaction.postDate,
        completeDate: transaction.completeDate,
        targetUserId: transaction.targetUserId,
        beneficiaryUserIds: transaction.beneficiaryUserIds,
        note: transaction.note ?? '',
        linkedTransactionId: transaction.linkedTransactionId ?? '',
      };

    return {
      type: this.initialType(),
      amount: 0,
      name: '',
      postDate: today,
      completeDate: today,
      targetUserId: defaultUserId,
      beneficiaryUserIds:
        this.initialType() === TransactionType.Expense
          ? members.map((member) => member.id)
          : [defaultUserId],
      note: '',
      linkedTransactionId: '',
    };
  });
  protected readonly $form = form(this.$transactionData, (path) => {
    required(path.name);
    minLength(path.name, 2);
    required(path.amount);
    min(path.amount, 0.01);
    required(path.postDate);
    required(path.completeDate);
    required(path.targetUserId);
    minLength(path.beneficiaryUserIds, 1, {
      message: 'Select at least one person who benefits from this transaction.',
    });
  });

  protected onSaveTransaction(event: Event): void {
    event.preventDefault();
    if (this.$form().invalid()) return;
    const value = this.$transactionData();
    this.save.emit({
      type: value.type,
      amount: value.amount,
      name: value.name,
      postDate: value.postDate,
      completeDate: value.completeDate,
      targetUserId: value.targetUserId,
      beneficiaryUserIds: value.beneficiaryUserIds,
      ...(value.note ? { note: value.note } : {}),
      ...(this.$isRefund() && value.linkedTransactionId
        ? { linkedTransactionId: value.linkedTransactionId }
        : {}),
    });
  }

  protected onCancel(): void {
    this.cancelRequested.emit();
  }
}
// #endregion
