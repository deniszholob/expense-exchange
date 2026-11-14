// #region Imports
import { z } from 'zod';
// #endregion

// #region Enum
export enum TransactionType {
  Expense = 'Expense',
  Income = 'Income',
  Refund = 'Refund',
}
// #endregion

// #region Schemas
export function createTransactionSchemas<T extends string>(
  transactionTypeSchema: z.ZodType<T>,
  refundType: T,
) {
  const createTransactionFieldsSchema = z.object({
    type: transactionTypeSchema,
    amount: z.number().finite().positive(),
    name: z.string().trim().min(1),
    postDate: z.iso.date(),
    completeDate: z.iso.date(),
    targetParticipantId: z
      .string()
      .min(1)
      .describe(
        'The participant who paid for an expense or received income/refund funds.',
      ),
    beneficiaryParticipantIds: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        'Explicit list of participants who benefit from the transaction; includes the target participant only when they benefit.',
      ),
    note: z.string().optional(),
    linkedTransactionId: z.string().min(1).optional(),
  });

  const CreateTransactionSchema = createTransactionFieldsSchema.superRefine(
    (transaction, context) => {
      if (transaction.type !== refundType && transaction.linkedTransactionId)
        context.addIssue({
          code: 'custom',
          message: 'Only refunds can link to another transaction',
          path: ['linkedTransactionId'],
        });
      if (
        new Set(transaction.beneficiaryParticipantIds).size !==
        transaction.beneficiaryParticipantIds.length
      )
        context.addIssue({
          code: 'custom',
          message: 'A beneficiary can only be listed once',
          path: ['beneficiaryParticipantIds'],
        });
    },
  );

  const TransactionSchema = createTransactionFieldsSchema.extend({
    id: z.string().min(1),
    ownerUserId: z.string().min(1).optional(),
  });

  return { CreateTransactionSchema, TransactionSchema };
}

const DOMAIN_TRANSACTION_SCHEMAS = createTransactionSchemas(
  z.enum(TransactionType),
  TransactionType.Refund,
);

export const CreateTransactionSchema =
  DOMAIN_TRANSACTION_SCHEMAS.CreateTransactionSchema;
export const TransactionSchema = DOMAIN_TRANSACTION_SCHEMAS.TransactionSchema;
// #endregion

// #region Models
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
// #endregion
