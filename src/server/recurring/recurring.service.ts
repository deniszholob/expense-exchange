// #region Imports
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRecurringRule,
  MarkRecurringOccurrencePaid,
  RecurringOccurrence,
  RecurringRule,
} from './recurring.schema.js';
import { RecurringRepository } from './recurring.repository.js';
import { getRecurringAmountOnDate } from '../../util/recurring-price.util.js';
// #endregion

// #region Service
@Injectable()
export class RecurringService {
  public constructor(private readonly repository: RecurringRepository) {}

  public async getRules(userId: string): Promise<RecurringRule[]> {
    return (await this.repository.getRules()).filter((rule) =>
      includesParticipant(rule, userId),
    );
  }

  public async createRule(
    input: CreateRecurringRule,
    ownerUserId: string,
  ): Promise<RecurringRule> {
    return this.repository.createRule(input, ownerUserId);
  }

  public async updateRule(
    id: string,
    input: CreateRecurringRule,
    userId: string,
  ): Promise<RecurringRule> {
    const existing = await this.getRuleForParticipant(id, userId);
    if (existing.ownerUserId !== userId)
      throw new ForbiddenException('Only the rule owner can change it');
    return this.repository.updateRule(id, input);
  }

  public async deleteRule(
    id: string,
    userId: string,
    deleteHistory: boolean,
  ): Promise<RecurringRule> {
    const existing = await this.getRuleForParticipant(id, userId);
    if (existing.ownerUserId !== userId)
      throw new ForbiddenException('Only the rule owner can delete it');
    return this.repository.deleteRule(id, deleteHistory);
  }

  public async getOccurrences(userId: string): Promise<RecurringOccurrence[]> {
    const occurrences =
      await this.repository.materializeOccurrences(todayUtc());
    return occurrences.filter((occurrence) =>
      includesParticipant(occurrence, userId),
    );
  }

  public async markOccurrencePaid(
    id: string,
    payment: MarkRecurringOccurrencePaid,
    userId: string,
  ): Promise<RecurringOccurrence> {
    const [occurrences, rules] = await Promise.all([
      this.repository.materializeOccurrences(todayUtc()),
      this.repository.getRules(),
    ]);
    const occurrence = occurrences.find((item) => item.id === id);
    if (!occurrence)
      throw new NotFoundException('Recurring occurrence not found');
    if (!includesParticipant(occurrence, userId))
      throw new ForbiddenException(
        'Only a participant can update this occurrence',
      );
    const rule = rules.find((item) => item.id === occurrence.ruleId);
    const scheduledAmount = rule
      ? getRecurringAmountOnDate(rule, occurrence.statementDate)
      : occurrence.amount;
    const fixedAmount =
      scheduledAmount === undefined
        ? undefined
        : (occurrence.amount ?? scheduledAmount);
    if (occurrence.isAutopay && scheduledAmount !== undefined)
      throw new BadRequestException(
        'Fixed-price autopay occurrences are managed by the rule',
      );
    if (fixedAmount !== undefined && payment.amount !== fixedAmount)
      throw new BadRequestException(
        'The amount is fixed by the recurring rule',
      );
    if (occurrence.isAutopay && payment.payDate !== occurrence.payDate)
      throw new BadRequestException(
        'Autopay uses the scheduled payment date from the rule',
      );
    if (payment.payDate < occurrence.statementDate)
      throw new BadRequestException(
        'Payment date must be on or after the statement date',
      );
    return this.repository.markOccurrencePaid(id, payment);
  }

  private async getRuleForParticipant(
    id: string,
    userId: string,
  ): Promise<RecurringRule> {
    const rule = (await this.repository.getRules()).find(
      (item) => item.id === id,
    );
    if (!rule) throw new NotFoundException('Recurring rule not found');
    if (!includesParticipant(rule, userId))
      throw new ForbiddenException('Only a participant can access this rule');
    return rule;
  }
}
// #endregion

// #region Helpers
function includesParticipant(
  record: Pick<
    RecurringRule,
    'ownerUserId' | 'targetParticipantId' | 'beneficiaryParticipantIds'
  >,
  userId: string,
): boolean {
  return (
    record.ownerUserId === userId ||
    record.targetParticipantId === userId ||
    record.beneficiaryParticipantIds.includes(userId)
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// #endregion
