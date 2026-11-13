// #region Imports
import { z } from 'zod';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import { createTransactionSchemas } from 'src/util/transaction.schema';
// #endregion

// #region Schema
export const LocalTransactionSchema = createTransactionSchemas(
  z.enum(TransactionType),
  TransactionType.Refund,
).TransactionSchema;
// #endregion
