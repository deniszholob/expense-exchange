// #region Imports
import { z } from 'zod';
import { RecurringRuleRecordSchema } from './recurring.schema.js';
// #endregion

// #region Schema
export const RecurringRulesStoreSchema = z.object({
  version: z.literal(1),
  rules: z.array(RecurringRuleRecordSchema),
});
// #endregion

// #region Model
export type RecurringRulesStore = z.infer<typeof RecurringRulesStoreSchema>;
// #endregion
