// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { LucideCheck } from '@lucide/angular';
import type {
  MarkRecurringOccurrencePaidDto,
  RecurringOccurrenceDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { DateInputComponent } from 'src/client/app/components/forms/date-input/date-input.component';
import { FormFieldComponent } from 'src/client/app/components/forms/form-field/form-field.component';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recurring-occurrence-payment',
  templateUrl: './recurring-occurrence-payment.component.html',
  host: { class: 'contents' },
  imports: [FormField, FormFieldComponent, DateInputComponent, LucideCheck],
})
export class RecurringOccurrencePaymentComponent {
  public readonly $occurrence = input.required<RecurringOccurrenceDto>();
  public readonly $isSubmitting = input(false);
  public readonly $isEditing = input(false);
  public readonly $isAmountEditable = input(true);
  public readonly $isPayDateEditable = input(true);
  public readonly $today = input.required<string>();
  public readonly paymentConfirmed = output<MarkRecurringOccurrencePaidDto>();
  public readonly cancelRequested = output<void>();

  protected readonly $paymentValue = linkedSignal(() => ({
    amount: this.$occurrence().amount ?? null,
    payDate: this.$occurrence().payDate,
  }));
  protected readonly $paymentForm = form(this.$paymentValue, (path) => {
    required(path.amount);
    min(path.amount, 0.01);
    required(path.payDate);
  });
  protected readonly $canConfirm = computed(() => {
    const payment = this.$paymentValue();
    return (
      !this.$paymentForm().invalid() &&
      payment.amount !== null &&
      payment.amount > 0 &&
      (!this.$isPayDateEditable() ||
        (payment.payDate >= this.$occurrence().statementDate &&
          payment.payDate <= this.$today()))
    );
  });

  protected confirmPayment(event: Event): void {
    event.preventDefault();
    if (!this.$canConfirm() || this.$isSubmitting()) return;

    const payment = this.$paymentValue();
    if (payment.amount === null) return;
    this.paymentConfirmed.emit({
      amount: payment.amount,
      payDate: payment.payDate,
    });
  }
}
// #endregion
