// #region Imports
import { z } from 'zod';
import { TransactionSchema } from '../../util/transaction.schema.js';
// #endregion

// #region Schema
export const TransactionStoreSchema = z.object({
  version: z.literal(1),
  transactions: z.array(TransactionSchema),
});
// #endregion

// #region Model
export type TransactionStore = z.infer<typeof TransactionStoreSchema>;
// #endregion
