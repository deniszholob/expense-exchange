// @ref https://storybook.js.org/docs/writing-stories
// #region Imports
import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  RecurringTransactionType,
  type RecurringOccurrenceDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { RecurringOccurrencePaymentComponent } from './recurring-occurrence-payment.component';
// #endregion

// #region Stories
const occurrence: RecurringOccurrenceDto = {
  id: 'occurrence-1',
  ruleId: 'rule-1',
  ownerUserId: 'user-1',
  type: RecurringTransactionType.Expense,
  name: 'Electric bill',
  targetParticipantId: 'user-1',
  beneficiaryParticipantIds: ['user-1', 'user-2'],
  statementDate: '2026-11-01',
  payDate: '2026-11-07',
  isPaid: false,
  isAutopay: false,
  isAmountVariable: false,
};

const meta: Meta<RecurringOccurrencePaymentComponent> = {
  component: RecurringOccurrencePaymentComponent,
  title: 'Recurring/Occurrence payment',
  args: {
    $occurrence: occurrence,
    $today: '2026-11-13',
  },
};
export default meta;

export const ConfirmPayment: StoryObj<RecurringOccurrencePaymentComponent> = {};

export const VariableAutopayAmount: StoryObj<RecurringOccurrencePaymentComponent> =
  {
    args: {
      $occurrence: {
        ...occurrence,
        isAutopay: true,
      },
      $isAmountEditable: true,
      $isPayDateEditable: false,
    },
  };

export const FixedManualPayment: StoryObj<RecurringOccurrencePaymentComponent> =
  {
    args: {
      $occurrence: {
        ...occurrence,
        amount: 82.45,
      },
      $isAmountEditable: false,
      $isPayDateEditable: true,
    },
  };

export const VariableManualPayment: StoryObj<RecurringOccurrencePaymentComponent> =
  {
    args: {
      $isAmountEditable: true,
      $isPayDateEditable: true,
    },
  };

export const EditCompletedPayment: StoryObj<RecurringOccurrencePaymentComponent> =
  {
    args: {
      $occurrence: {
        ...occurrence,
        amount: 82.45,
        payDate: '2026-11-09',
        isPaid: true,
      },
      $isEditing: true,
    },
  };
// #endregion
