// #region Imports
import { z } from 'zod';
import { TransactionSchema } from '../../util/transaction.schema.js';
// #endregion

// #region Schema
const CurrentTransactionStoreSchema = z.object({
  version: z.literal(2),
  transactions: z.array(TransactionSchema),
});

/** Convert the persisted user-only participant fields to participant IDs once. */
export const TransactionStoreSchema = z.preprocess((value: unknown) => {
  if (!isRecord(value) || value['version'] !== 1) return value;
  const transactions = Array.isArray(value['transactions'])
    ? value['transactions'].map((transaction) => {
        if (!isRecord(transaction)) return transaction;
        return {
          ...transaction,
          targetParticipantId:
            transaction['targetParticipantId'] ?? transaction['targetUserId'],
          beneficiaryParticipantIds:
            transaction['beneficiaryParticipantIds'] ??
            transaction['beneficiaryUserIds'],
        };
      })
    : value['transactions'];
  return { ...value, version: 2, transactions };
}, CurrentTransactionStoreSchema);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion

// #region Model
export type TransactionStore = z.infer<typeof TransactionStoreSchema>;
// #endregion
