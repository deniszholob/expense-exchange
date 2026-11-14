// #region Imports
import { z } from 'zod';
import {
  RecurringOccurrenceRecordSchema,
  RecurringRuleRecordSchema,
} from './recurring.schema.js';
import { addDaysToDate } from './recurring.schedule.js';
// #endregion

// #region Schema
const CurrentRecurringStoreSchema = z
  .object({
    version: z.literal(7),
    rules: z.array(RecurringRuleRecordSchema),
    occurrences: z.array(RecurringOccurrenceRecordSchema),
  })
  .superRefine((store, context) => {
    const occurrenceKeys = new Set<string>();
    store.occurrences.forEach((occurrence, index) => {
      const key = `${occurrence.ruleId}:${occurrence.statementDate}`;
      if (occurrenceKeys.has(key))
        context.addIssue({
          code: 'custom',
          message: 'A rule can only have one occurrence per cycle date',
          path: ['occurrences', index],
        });
      occurrenceKeys.add(key);
    });
  });

/** One-time persisted-format conversions for the currently used recurring store. */
export const RecurringStoreSchema = z.preprocess((value: unknown) => {
  if (
    !isRecord(value) ||
    (value['version'] !== 1 &&
      value['version'] !== 2 &&
      value['version'] !== 3 &&
      value['version'] !== 4 &&
      value['version'] !== 5 &&
      value['version'] !== 6)
  )
    return value;
  const legacyRules = Array.isArray(value['rules'])
    ? value['rules'].map((rule) => {
        if (
          !isRecord(rule) ||
          typeof rule['startDate'] !== 'string' ||
          value['version'] === 3 ||
          value['version'] === 4 ||
          value['version'] === 5
        )
          return rule;
        const legacyPrices = Array.isArray(rule['priceChanges'])
          ? rule['priceChanges']
          : [];
        const prices: unknown[] = Array.isArray(rule['prices'])
          ? rule['prices'].map((price) =>
              isRecord(price) && price['amount'] === null
                ? {
                    effectiveDate: price['effectiveDate'],
                    amount: undefined,
                  }
                : price,
            )
          : [
              ...legacyPrices,
              ...(typeof rule['amount'] === 'number'
                ? [
                    {
                      effectiveDate: rule['startDate'],
                      amount: rule['amount'],
                    },
                  ]
                : []),
            ];
        if (
          !prices.some(
            (price) =>
              isRecord(price) && price['effectiveDate'] === rule['startDate'],
          )
        )
          prices.push({ effectiveDate: rule['startDate'] });
        prices.sort((first, second) => {
          const firstDate = isRecord(first)
            ? String(first['effectiveDate'])
            : '';
          const secondDate = isRecord(second)
            ? String(second['effectiveDate'])
            : '';
          return firstDate.localeCompare(secondDate);
        });
        return {
          ...rule,
          prices,
          startDate: undefined,
          amount: undefined,
          priceChanges: undefined,
        };
      })
    : value['rules'];
  const rules = Array.isArray(legacyRules)
    ? legacyRules.map((rule) =>
        migrateRulePayDates(migrateParticipantFields(rule)),
      )
    : legacyRules;
  const occurrences = Array.isArray(value['occurrences'])
    ? value['occurrences'].map(toOccurrenceRecord)
    : value['occurrences'];
  return { ...value, version: 7, rules, occurrences };
}, CurrentRecurringStoreSchema);

function migrateRulePayDates(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const offset =
    typeof value['payDateOffsetDays'] === 'number' &&
    Number.isInteger(value['payDateOffsetDays']) &&
    value['payDateOffsetDays'] >= 0
      ? value['payDateOffsetDays']
      : 0;
  const prices = Array.isArray(value['prices'])
    ? value['prices'].map((price) => {
        if (!isRecord(price) || typeof price['effectiveDate'] !== 'string')
          return price;
        return {
          ...price,
          payDate:
            price['payDate'] ?? addDaysToDate(price['effectiveDate'], offset),
        };
      })
    : value['prices'];
  const rule = { ...value };
  delete rule['payDateOffsetDays'];
  return { ...rule, prices };
}

function toOccurrenceRecord(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const statementDate = value['statementDate'] ?? value['cycleDate'];
  const completeDate = value['completeDate'];
  return {
    id: value['id'],
    ruleId: value['ruleId'],
    statementDate,
    payDate: completeDate ?? value['payDate'] ?? statementDate,
    ...(value['amount'] === undefined ? {} : { amount: value['amount'] }),
    isPaid: value['isPaid'] ?? typeof completeDate === 'string',
  };
}

function migrateParticipantFields(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    targetParticipantId: value['targetParticipantId'] ?? value['targetUserId'],
    beneficiaryParticipantIds:
      value['beneficiaryParticipantIds'] ?? value['beneficiaryUserIds'],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
// #endregion

// #region Model
export type RecurringStore = z.infer<typeof RecurringStoreSchema>;
// #endregion
