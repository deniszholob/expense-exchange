// #region Imports
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RecurringOccurrenceSchema,
  RecurringOccurrenceRecordSchema,
  RecurringRuleRecordSchema,
  RecurringRuleSchema,
} from './recurring.schema.js';
import type {
  CreateRecurringRule,
  MarkRecurringOccurrencePaid,
  RecurringOccurrence,
  RecurringOccurrenceRecord,
  RecurringRule,
  RecurringRuleRecord,
} from './recurring.schema.js';
import { RecurringRepository } from './recurring.repository.js';
import { RecurringStoreSchema } from './recurring-store.schema.js';
import { RecurringRulesStoreSchema } from './recurring-rules-store.schema.js';
import { RecurringOccurrencesStoreSchema } from './recurring-occurrences-store.schema.js';
import type { RecurringOccurrencesStore } from './recurring-occurrences-store.schema.js';
import { JsonStore } from '../utils/json-store.js';
import {
  isNodeErrorCode,
  readJsonFile,
  writeJsonFileAtomically,
} from '../utils/json-file.utils.js';
import {
  getRecurringStartDate,
  getRecurringAmountOnDate,
  isFullyAutomatedRecurringRule,
} from '../../util/recurring-price.util.js';
import {
  addCadenceToDate,
  getNextCadenceDateAfter,
} from './recurring.schedule.js';
// #endregion

// #region JSON Adapter
@Injectable()
export class RecurringJsonAdapter extends RecurringRepository {
  private readonly dataDirectory = process.env['DATA_DIR'] ?? '.dist/data';
  private readonly legacyStorePath = join(this.dataDirectory, 'recurring.json');
  private readonly rulesStore = new JsonStore(
    join(this.dataDirectory, 'recurring-rules.json'),
    RecurringRulesStoreSchema,
    () => ({ version: 1, rules: [] }),
  );
  private readonly occurrencesStore = new JsonStore(
    join(this.dataDirectory, 'recurring-occurrences.json'),
    RecurringOccurrencesStoreSchema,
    () => ({ version: 2, occurrencesByRuleId: {} }),
  );
  private operationQueue: Promise<void> = Promise.resolve();
  private migration: Promise<void> | undefined;

  public async getRules(): Promise<RecurringRule[]> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      return (await this.rulesStore.read()).rules
        .filter((rule) => !rule.isArchived)
        .map(toRecurringRule);
    });
  }

  public async getOccurrences(): Promise<RecurringOccurrence[]> {
    return this.materializeOccurrences(getUtcToday());
  }

  public async createRule(
    input: CreateRecurringRule,
    ownerUserId: string,
  ): Promise<RecurringRule> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      return this.rulesStore.update((store) => {
        const record = RecurringRuleRecordSchema.parse({
          ...input,
          prices: sortPrices(input.prices),
          id: randomUUID(),
          ownerUserId,
          nextStatementDate: getRecurringStartDate(input),
        });
        store.rules.push(record);
        return toRecurringRule(record);
      });
    });
  }

  public async updateRule(
    id: string,
    input: CreateRecurringRule,
  ): Promise<RecurringRule> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      const ruleStore = await this.rulesStore.read();
      const occurrenceStore = await this.occurrencesStore.read();
      const index = ruleStore.rules.findIndex(
        (rule) => rule.id === id && !rule.isArchived,
      );
      if (index < 0) throw new NotFoundException('Recurring rule not found');
      const existing = ruleStore.rules[index]!;
      const today = getUtcToday();
      const record = RecurringRuleRecordSchema.parse({
        ...input,
        prices: sortPrices(input.prices),
        id,
        ownerUserId: existing.ownerUserId,
        isArchived: false,
        nextStatementDate: getNextStatementDateAfter(
          {
            cadence: input.cadence,
            prices: sortPrices(input.prices),
          },
          today,
        ),
      });
      const storedOccurrences = getOccurrencesForRule(occurrenceStore, id);
      const existingOccurrences = isFullyAutomatedRecurringRule(existing)
        ? buildAutomatedOccurrences(existing, today, storedOccurrences)
        : storedOccurrences;
      const updatedOccurrences = isFullyAutomatedRecurringRule(record)
        ? []
        : buildConfirmedOccurrences(record, today, existingOccurrences);
      ruleStore.rules[index] = record;
      setOccurrencesForRule(occurrenceStore, id, updatedOccurrences);
      await this.occurrencesStore.write(occurrenceStore);
      await this.rulesStore.write(ruleStore);
      return toRecurringRule(record);
    });
  }

  public async deleteRule(
    id: string,
    deleteHistory: boolean,
  ): Promise<RecurringRule> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      const ruleStore = await this.rulesStore.read();
      const index = ruleStore.rules.findIndex(
        (rule) => rule.id === id && !rule.isArchived,
      );
      if (index < 0) throw new NotFoundException('Recurring rule not found');
      const rule = ruleStore.rules[index]!;
      const result = toRecurringRule(rule);

      if (!deleteHistory) {
        rule.isArchived = true;
        await this.rulesStore.write(ruleStore);
        return result;
      }

      // Archive first so a partial multi-file write can never generate future occurrences.
      rule.isArchived = true;
      await this.rulesStore.write(ruleStore);
      const occurrenceStore = await this.occurrencesStore.read();
      setOccurrencesForRule(occurrenceStore, id, []);
      await this.occurrencesStore.write(occurrenceStore);
      ruleStore.rules.splice(index, 1);
      await this.rulesStore.write(ruleStore);
      return result;
    });
  }

  public async materializeOccurrences(
    today: string,
  ): Promise<RecurringOccurrence[]> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      const ruleStore = await this.rulesStore.read();
      const occurrenceStore = await this.occurrencesStore.read();
      const derivedOccurrences: Array<{
        occurrence: RecurringOccurrenceRecord;
        rule: RecurringRuleRecord;
      }> = [];
      for (const rule of ruleStore.rules) {
        if (!isFullyAutomatedRecurringRule(rule)) continue;
        const existing = getOccurrencesForRule(occurrenceStore, rule.id);
        derivedOccurrences.push(
          ...buildAutomatedOccurrences(rule, today, existing).map(
            (occurrence) => ({ occurrence, rule }),
          ),
        );
        setOccurrencesForRule(occurrenceStore, rule.id, []);
      }

      const occurrencesByRuleAndCycle = new Set(
        getAllOccurrences(occurrenceStore).map((occurrence) =>
          getOccurrenceKey(occurrence.ruleId, occurrence.statementDate),
        ),
      );

      for (const rule of ruleStore.rules) {
        if (rule.isArchived || isFullyAutomatedRecurringRule(rule)) continue;
        while (
          rule.nextStatementDate <= today &&
          (!rule.endDate || rule.nextStatementDate <= rule.endDate)
        ) {
          const statementDate = rule.nextStatementDate;
          const amount = getRecurringAmountOnDate(rule, statementDate);
          const occurrence = RecurringOccurrenceRecordSchema.parse({
            id: randomUUID(),
            ruleId: rule.id,
            statementDate,
            payDate: getExpectedPayDate(rule, statementDate),
            ...(amount === undefined ? {} : { amount }),
            isPaid:
              rule.isAutopay &&
              amount !== undefined &&
              getExpectedPayDate(rule, statementDate) <= today,
          });
          const key = getOccurrenceKey(rule.id, statementDate);
          if (!occurrencesByRuleAndCycle.has(key)) {
            setOccurrencesForRule(occurrenceStore, rule.id, [
              ...getOccurrencesForRule(occurrenceStore, rule.id),
              occurrence,
            ]);
            occurrencesByRuleAndCycle.add(key);
          }
          rule.nextStatementDate = getNextStatementDateAfter(
            rule,
            statementDate,
          );
        }
      }

      for (const [ruleId, occurrences] of Object.entries(
        occurrenceStore.occurrencesByRuleId,
      )) {
        const rule = ruleStore.rules.find((item) => item.id === ruleId);
        for (const occurrence of occurrences) {
          if (
            rule &&
            !rule.isArchived &&
            rule.isAutopay &&
            occurrence.amount !== undefined &&
            occurrence.payDate <= today
          )
            occurrence.isPaid = true;
        }
      }

      const rulesById = new Map(ruleStore.rules.map((rule) => [rule.id, rule]));
      const persisted = getAllOccurrences(occurrenceStore).flatMap(
        (occurrence) => {
          const rule = rulesById.get(occurrence.ruleId);
          return rule ? [toRecurringOccurrence(occurrence, rule)] : [];
        },
      );
      const derived = derivedOccurrences.map(({ occurrence, rule }) =>
        toRecurringOccurrence(occurrence, rule),
      );
      await this.occurrencesStore.write(occurrenceStore);
      await this.rulesStore.write(ruleStore);
      return [...persisted, ...derived].sort((first, second) =>
        first.statementDate.localeCompare(second.statementDate),
      );
    });
  }

  public async markOccurrencePaid(
    id: string,
    payment: MarkRecurringOccurrencePaid,
  ): Promise<RecurringOccurrence> {
    return this.runExclusive(async () => {
      await this.ensureStoresMigrated();
      const occurrenceStore = await this.occurrencesStore.read();
      const ruleStore = await this.rulesStore.read();
      const occurrenceMatch = Object.entries(
        occurrenceStore.occurrencesByRuleId,
      ).flatMap(([ruleId, occurrences]) => {
        const occurrence = occurrences.find((item) => item.id === id);
        return occurrence ? [{ ruleId, occurrence }] : [];
      })[0];
      const occurrence = occurrenceMatch?.occurrence;
      if (!occurrence)
        throw new NotFoundException('Recurring occurrence not found');
      occurrence.amount = payment.amount;
      occurrence.payDate = payment.payDate;
      occurrence.isPaid = true;
      const rule = ruleStore.rules.find(
        (item) => item.id === occurrenceMatch.ruleId,
      );
      if (!rule) throw new NotFoundException('Recurring rule not found');
      await this.occurrencesStore.write(occurrenceStore);
      return toRecurringOccurrence(
        { ...occurrence, ruleId: occurrenceMatch.ruleId },
        rule,
      );
    });
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private ensureStoresMigrated(): Promise<void> {
    this.migration ??= this.migrateLegacyStore();
    return this.migration;
  }

  private async migrateLegacyStore(): Promise<void> {
    const rulesPath = join(this.dataDirectory, 'recurring-rules.json');
    const occurrencesPath = join(
      this.dataDirectory,
      'recurring-occurrences.json',
    );
    const [legacyValue, existingRules, existingOccurrences] = await Promise.all(
      [
        readOptionalJsonFile(this.legacyStorePath),
        readOptionalJsonFile(rulesPath),
        readOptionalJsonFile(occurrencesPath),
      ],
    );
    const legacy =
      legacyValue === undefined
        ? undefined
        : RecurringStoreSchema.parse(legacyValue);
    const rules =
      existingRules !== undefined
        ? RecurringRulesStoreSchema.parse(existingRules)
        : RecurringRulesStoreSchema.parse({
            version: 1,
            rules: legacy?.rules ?? [],
          });
    const automatedRuleIds = new Set(
      (legacy?.rules ?? [])
        .filter((rule) => isFullyAutomatedRecurringRule(rule))
        .map((rule) => rule.id),
    );
    const occurrences =
      existingOccurrences !== undefined
        ? RecurringOccurrencesStoreSchema.parse(existingOccurrences)
        : groupOccurrencesByRuleId(
            (legacy?.occurrences ?? []).filter(
              (occurrence) => !automatedRuleIds.has(occurrence.ruleId),
            ),
          );

    if (existingRules === undefined)
      await writeJsonFileAtomically(rulesPath, rules);
    if (
      existingOccurrences === undefined ||
      isFlatOccurrencesStore(existingOccurrences)
    )
      await writeJsonFileAtomically(occurrencesPath, occurrences);
    if (legacyValue !== undefined)
      await unlink(this.legacyStorePath).catch((error: unknown) => {
        if (!isNodeErrorCode(error, 'ENOENT')) throw error;
      });
  }
}
// #endregion

// #region Helpers
function getOccurrencesForRule(
  store: RecurringOccurrencesStore,
  ruleId: string,
): RecurringOccurrenceRecord[] {
  return (store.occurrencesByRuleId[ruleId] ?? []).map((occurrence) => ({
    ...occurrence,
    ruleId,
  }));
}

function getAllOccurrences(
  store: RecurringOccurrencesStore,
): RecurringOccurrenceRecord[] {
  return Object.entries(store.occurrencesByRuleId).flatMap(([ruleId]) =>
    getOccurrencesForRule(store, ruleId),
  );
}

function setOccurrencesForRule(
  store: RecurringOccurrencesStore,
  ruleId: string,
  occurrences: RecurringOccurrenceRecord[],
): void {
  if (!occurrences.length) {
    delete store.occurrencesByRuleId[ruleId];
    return;
  }

  store.occurrencesByRuleId[ruleId] = occurrences.map((occurrence) => {
    const storedOccurrence = { ...occurrence };
    Reflect.deleteProperty(storedOccurrence, 'ruleId');
    return storedOccurrence;
  });
}

function groupOccurrencesByRuleId(
  occurrences: RecurringOccurrenceRecord[],
): RecurringOccurrencesStore {
  const occurrencesByRuleId: RecurringOccurrencesStore['occurrencesByRuleId'] =
    {};
  for (const occurrence of occurrences) {
    const { ruleId, ...entry } = occurrence;
    (occurrencesByRuleId[ruleId] ??= []).push(entry);
  }
  return RecurringOccurrencesStoreSchema.parse({
    version: 2,
    occurrencesByRuleId,
  });
}

function isFlatOccurrencesStore(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    value.version === 1
  );
}

function toRecurringRule(record: RecurringRuleRecord): RecurringRule {
  return RecurringRuleSchema.parse({
    id: record.id,
    ownerUserId: record.ownerUserId,
    type: record.type,
    name: record.name,
    prices: record.prices,
    targetParticipantId: record.targetParticipantId,
    beneficiaryParticipantIds: record.beneficiaryParticipantIds,
    cadence: record.cadence,
    ...(record.endDate === undefined ? {} : { endDate: record.endDate }),
    isAutopay: record.isAutopay,
    ...(record.note === undefined ? {} : { note: record.note }),
  });
}

function toRecurringOccurrence(
  occurrence: RecurringOccurrenceRecord,
  rule: RecurringRuleRecord,
): RecurringOccurrence {
  return RecurringOccurrenceSchema.parse({
    ...occurrence,
    ownerUserId: rule.ownerUserId,
    type: rule.type,
    name: rule.name,
    targetParticipantId: rule.targetParticipantId,
    beneficiaryParticipantIds: rule.beneficiaryParticipantIds,
    isAutopay: rule.isAutopay,
    isAmountVariable:
      getRecurringAmountOnDate(rule, occurrence.statementDate) === undefined,
    ...(rule.note === undefined ? {} : { note: rule.note }),
  });
}

function sortPrices(
  prices: CreateRecurringRule['prices'],
): CreateRecurringRule['prices'] {
  return prices
    .map((price) => ({
      ...price,
      payDate: price.payDate ?? price.effectiveDate,
    }))
    .sort((first, second) =>
      first.effectiveDate.localeCompare(second.effectiveDate),
    );
}

function getOccurrenceKey(ruleId: string, cycleDate: string): string {
  return `${ruleId}:${cycleDate}`;
}

function getUtcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readOptionalJsonFile(
  filePath: string,
): Promise<unknown | undefined> {
  try {
    return await readJsonFile(filePath);
  } catch (error: unknown) {
    if (isNodeErrorCode(error, 'ENOENT')) return undefined;
    throw error;
  }
}

function buildAutomatedOccurrences(
  rule: RecurringRuleRecord,
  today: string,
  previousOccurrences: RecurringOccurrenceRecord[],
): RecurringOccurrenceRecord[] {
  const previousByCycleDate = new Map(
    previousOccurrences.map((occurrence) => [
      occurrence.statementDate,
      occurrence,
    ]),
  );
  return getStatementDates(rule, today).map((statementDate) => {
    const previousOccurrence = previousByCycleDate.get(statementDate);
    const scheduledAmount = getRecurringAmountOnDate(rule, statementDate);
    const amount = scheduledAmount ?? previousOccurrence?.amount;
    return RecurringOccurrenceRecordSchema.parse({
      id: previousOccurrence?.id ?? `auto:${rule.id}:${statementDate}`,
      ruleId: rule.id,
      statementDate,
      payDate: getExpectedPayDate(rule, statementDate),
      ...(amount === undefined ? {} : { amount }),
      isPaid:
        scheduledAmount !== undefined &&
        rule.isAutopay &&
        getExpectedPayDate(rule, statementDate) <= today,
    });
  });
}

function buildConfirmedOccurrences(
  rule: RecurringRuleRecord,
  today: string,
  previousOccurrences: RecurringOccurrenceRecord[],
): RecurringOccurrenceRecord[] {
  const statementDates = getStatementDates(rule, today);
  const previous = [...previousOccurrences].sort((first, second) =>
    first.statementDate.localeCompare(second.statementDate),
  );
  const newDateOffset = Math.max(0, statementDates.length - previous.length);
  const oldRecordOffset = Math.max(0, previous.length - statementDates.length);

  return statementDates.map((statementDate, index) => {
    const previousOccurrence =
      previous[index - newDateOffset + oldRecordOffset];
    if (
      previousOccurrence?.isPaid &&
      previousOccurrence.payDate < statementDate
    )
      throw new BadRequestException(
        'Cannot move a statement date later than its recorded payment date',
      );

    return RecurringOccurrenceRecordSchema.parse({
      id: previousOccurrence?.id ?? randomUUID(),
      ruleId: rule.id,
      statementDate,
      payDate: getExpectedPayDate(rule, statementDate),
      ...((previousOccurrence?.isPaid
        ? previousOccurrence.amount
        : (getRecurringAmountOnDate(rule, statementDate) ??
          previousOccurrence?.amount)) === undefined
        ? {}
        : {
            amount: previousOccurrence?.isPaid
              ? previousOccurrence.amount
              : (getRecurringAmountOnDate(rule, statementDate) ??
                previousOccurrence?.amount),
          }),
      isPaid: previousOccurrence?.isPaid ?? false,
    });
  });
}

function getStatementDates(rule: RecurringRuleRecord, today: string): string[] {
  const statementDates = new Set<string>();
  const prices = sortPrices(rule.prices);
  prices.forEach((price, index) => {
    const nextPrice = prices[index + 1];
    const lastDate = [today, rule.endDate, nextPrice?.effectiveDate]
      .filter((date): date is string => date !== undefined)
      .sort((first, second) => first.localeCompare(second))[0]!;
    if (price.effectiveDate > lastDate) return;

    let statementDate = price.effectiveDate;
    while (
      statementDate <= lastDate &&
      (!nextPrice || statementDate < nextPrice.effectiveDate)
    ) {
      statementDates.add(statementDate);
      statementDate = addCadenceToDate(
        statementDate,
        rule.cadence,
        price.effectiveDate,
      );
    }
  });
  return [...statementDates].sort((first, second) =>
    first.localeCompare(second),
  );
}

function getExpectedPayDate(
  rule: RecurringRuleRecord,
  statementDate: string,
): string {
  let price = rule.prices[0]!;
  for (const candidate of rule.prices) {
    if (
      candidate.effectiveDate <= statementDate &&
      candidate.effectiveDate > price.effectiveDate
    )
      price = candidate;
  }

  let cycleDate = price.effectiveDate;
  const payDateAnchor = price.payDate ?? price.effectiveDate;
  let expectedPayDate = payDateAnchor;
  while (cycleDate < statementDate) {
    cycleDate = addCadenceToDate(cycleDate, rule.cadence, price.effectiveDate);
    expectedPayDate = addCadenceToDate(
      expectedPayDate,
      rule.cadence,
      payDateAnchor,
    );
  }
  return expectedPayDate;
}

function getNextStatementDateAfter(
  rule: Pick<RecurringRuleRecord, 'prices' | 'cadence'>,
  afterDate: string,
): string {
  const prices = sortPrices(rule.prices);
  for (const [index, price] of prices.entries()) {
    const nextPrice = prices[index + 1];
    const candidate =
      price.effectiveDate > afterDate
        ? price.effectiveDate
        : getNextCadenceDateAfter(price.effectiveDate, rule.cadence, afterDate);
    if (!nextPrice || candidate < nextPrice.effectiveDate) return candidate;
  }
  return getRecurringStartDate(rule);
}

// #endregion
