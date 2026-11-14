// #region Imports
import { z } from 'zod';
import { TransactionType } from '../../util/transaction.schema.js';
// #endregion

// #region Enums and Schemas
export enum RecurrenceCadence {
  Weekly = 'Weekly',
  Biweekly = 'Biweekly',
  Monthly = 'Monthly',
  Biannual = 'Biannual',
  Yearly = 'Yearly',
}

const RecurrenceCadenceSchema = z.enum(RecurrenceCadence);
const DateSchema = z.iso.date();
const PositiveAmountSchema = z.number().finite().positive();
const RecurringTransactionTypeSchema = z
  .enum(TransactionType)
  .exclude([TransactionType.Refund]);

export const RecurringPriceSchema = z.object({
  effectiveDate: DateSchema,
  payDate: DateSchema.optional(),
  amount: PositiveAmountSchema.optional(),
});

export const CreateRecurringRuleSchema = z
  .object({
    type: RecurringTransactionTypeSchema,
    name: z.string().trim().min(1),
    prices: z.array(RecurringPriceSchema).min(1),
    targetParticipantId: z.string().min(1),
    beneficiaryParticipantIds: z.array(z.string().min(1)).min(1),
    cadence: RecurrenceCadenceSchema,
    endDate: DateSchema.optional(),
    isAutopay: z.boolean(),
    note: z.string().optional(),
  })
  .superRefine((rule, context) => {
    const firstPriceDate = rule.prices.reduce(
      (earliest, price) =>
        price.effectiveDate < earliest ? price.effectiveDate : earliest,
      rule.prices[0]!.effectiveDate,
    );
    if (rule.endDate && rule.endDate < firstPriceDate)
      context.addIssue({
        code: 'custom',
        message: 'End date must be on or after the start date',
        path: ['endDate'],
      });
    const priceDates = new Set<string>();
    rule.prices.forEach((price, index) => {
      if (price.payDate && price.payDate < price.effectiveDate)
        context.addIssue({
          code: 'custom',
          message: 'Expected pay date must be on or after the effective date',
          path: ['prices', index, 'payDate'],
        });
      if (priceDates.has(price.effectiveDate))
        context.addIssue({
          code: 'custom',
          message: 'Only one price can be set for each date',
          path: ['prices', index, 'effectiveDate'],
        });
      priceDates.add(price.effectiveDate);
    });
    if (
      new Set(rule.beneficiaryParticipantIds).size !==
      rule.beneficiaryParticipantIds.length
    )
      context.addIssue({
        code: 'custom',
        message: 'A beneficiary can only be listed once',
        path: ['beneficiaryParticipantIds'],
      });
  });

export const RecurringRuleSchema = CreateRecurringRuleSchema.extend({
  id: z.string().min(1),
  ownerUserId: z.string().min(1),
});

export const UpdateRecurringRuleSchema = CreateRecurringRuleSchema;

export const RecurringRuleRecordSchema = RecurringRuleSchema.extend({
  nextStatementDate: DateSchema,
  isArchived: z.boolean().default(false),
});

export const RecurringOccurrenceSchema = z
  .object({
    id: z.string().min(1),
    ruleId: z.string().min(1),
    ownerUserId: z.string().min(1),
    type: RecurringTransactionTypeSchema,
    name: z.string().trim().min(1),
    amount: PositiveAmountSchema.optional(),
    targetParticipantId: z.string().min(1),
    beneficiaryParticipantIds: z.array(z.string().min(1)).min(1),
    statementDate: DateSchema,
    payDate: DateSchema,
    isPaid: z.boolean(),
    isAutopay: z.boolean(),
    isAmountVariable: z.boolean(),
    note: z.string().optional(),
  })
  .superRefine((occurrence, context) => {
    if (occurrence.payDate < occurrence.statementDate)
      context.addIssue({
        code: 'custom',
        message: 'Expected pay date must be on or after statement date',
        path: ['payDate'],
      });
    if (occurrence.isPaid && occurrence.amount === undefined)
      context.addIssue({
        code: 'custom',
        message: 'A paid occurrence must have an amount',
        path: ['amount'],
      });
  });

export const RecurringOccurrenceRecordSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  statementDate: DateSchema,
  payDate: DateSchema,
  amount: PositiveAmountSchema.optional(),
  isPaid: z.boolean(),
});

export const MarkRecurringOccurrencePaidSchema = z
  .object({
    amount: PositiveAmountSchema,
    payDate: DateSchema,
  })
  .superRefine((payment, context) => {
    if (payment.payDate > new Date().toISOString().slice(0, 10))
      context.addIssue({
        code: 'custom',
        message: 'Payment date cannot be in the future',
        path: ['payDate'],
      });
  });

// #endregion

// #region Models
export type CreateRecurringRule = z.infer<typeof CreateRecurringRuleSchema>;
export type UpdateRecurringRule = z.infer<typeof UpdateRecurringRuleSchema>;
export type RecurringRule = z.infer<typeof RecurringRuleSchema>;
export type RecurringRuleRecord = z.infer<typeof RecurringRuleRecordSchema>;
export type RecurringOccurrence = z.infer<typeof RecurringOccurrenceSchema>;
export type RecurringOccurrenceRecord = z.infer<
  typeof RecurringOccurrenceRecordSchema
>;
export type MarkRecurringOccurrencePaid = z.infer<
  typeof MarkRecurringOccurrencePaidSchema
>;
export type RecurringPrice = z.infer<typeof RecurringPriceSchema>;
// #endregion
