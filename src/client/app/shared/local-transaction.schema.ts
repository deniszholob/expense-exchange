// #region Imports
import { z } from 'zod';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import { createTransactionSchemas } from 'src/util/transaction.schema';
// #endregion

// #region Schema
const LocalTransactionValueSchema = createTransactionSchemas(
  z.enum(TransactionType),
  TransactionType.Refund,
).TransactionSchema;

export const LocalTransactionSchema = z.preprocess((value: unknown) => {
  if (typeof value !== 'object' || value === null) return value;
  const transaction = value as Record<string, unknown>;
  if (
    transaction['targetParticipantId'] !== undefined &&
    transaction['beneficiaryParticipantIds'] !== undefined
  )
    return value;
  return {
    ...transaction,
    targetParticipantId:
      transaction['targetParticipantId'] ?? transaction['targetUserId'],
    beneficiaryParticipantIds:
      transaction['beneficiaryParticipantIds'] ??
      transaction['beneficiaryUserIds'],
  };
}, LocalTransactionValueSchema);
// #endregion
