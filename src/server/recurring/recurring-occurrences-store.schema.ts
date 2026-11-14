// #region Imports
import { z } from 'zod';
import { RecurringOccurrenceRecordSchema } from './recurring.schema.js';
// #endregion

// #region Schema
const RecurringOccurrenceStoreEntrySchema =
  RecurringOccurrenceRecordSchema.omit({ ruleId: true });

const CurrentRecurringOccurrencesStoreSchema = z
  .object({
    version: z.literal(2),
    occurrencesByRuleId: z.record(
      z.string().min(1),
      z.array(RecurringOccurrenceStoreEntrySchema),
    ),
  })
  .superRefine((store, context) => {
    for (const [ruleId, occurrences] of Object.entries(
      store.occurrencesByRuleId,
    )) {
      const statementDates = new Set<string>();
      occurrences.forEach((occurrence, index) => {
        if (statementDates.has(occurrence.statementDate))
          context.addIssue({
            code: 'custom',
            message: 'A rule can only have one occurrence per statement date',
            path: ['occurrencesByRuleId', ruleId, index],
          });
        statementDates.add(occurrence.statementDate);
      });
    }
  });

/** Converts the previous flat store once, grouping rows and removing repeated rule IDs. */
export const RecurringOccurrencesStoreSchema = z.preprocess(
  (value: unknown) => {
    if (
      !isRecord(value) ||
      value['version'] !== 1 ||
      !Array.isArray(value['occurrences'])
    )
      return value;

    const occurrencesByRuleId: Record<string, unknown[]> = {};
    for (const occurrence of value['occurrences']) {
      if (!isRecord(occurrence) || typeof occurrence['ruleId'] !== 'string')
        return value;
      const { ruleId, ...entry } = occurrence;
      (occurrencesByRuleId[ruleId] ??= []).push(entry);
    }
    return { version: 2, occurrencesByRuleId };
  },
  CurrentRecurringOccurrencesStoreSchema,
);
// #endregion

// #region Model
export type RecurringOccurrencesStore = z.infer<
  typeof RecurringOccurrencesStoreSchema
>;
// #endregion

// #region Helpers
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion
