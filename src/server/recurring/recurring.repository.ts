// #region Imports
import type {
  CreateRecurringRule,
  MarkRecurringOccurrencePaid,
  RecurringOccurrence,
  RecurringRule,
} from './recurring.schema.js';
// #endregion

// #region Repository Contract
export abstract class RecurringRepository {
  public abstract getRules(): Promise<RecurringRule[]>;
  public abstract getOccurrences(): Promise<RecurringOccurrence[]>;
  public abstract createRule(
    input: CreateRecurringRule,
    ownerUserId: string,
  ): Promise<RecurringRule>;
  public abstract updateRule(
    id: string,
    input: CreateRecurringRule,
  ): Promise<RecurringRule>;
  public abstract deleteRule(
    id: string,
    deleteHistory: boolean,
  ): Promise<RecurringRule>;
  public abstract materializeOccurrences(
    today: string,
  ): Promise<RecurringOccurrence[]>;
  public abstract markOccurrencePaid(
    id: string,
    payment: MarkRecurringOccurrencePaid,
  ): Promise<RecurringOccurrence>;
}
// #endregion
