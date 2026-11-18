// #region Imports
import { ConflictException, Injectable } from '@nestjs/common';

import { RecurringRepository } from '../recurring/recurring.repository.js';
import { TransactionRepository } from '../transactions/transaction.repository.js';
// #endregion

// #region Service
@Injectable()
export class ParticipantReferenceService {
  public constructor(
    private readonly transactions: TransactionRepository,
    private readonly recurring: RecurringRepository,
  ) {}

  public async assertGroupMemberUnused(id: string): Promise<void> {
    const [transactions, rules, occurrences] = await this.getReferences();
    if (
      transactions.some((transaction) => referencesParticipant(transaction, id))
    )
      throw new ConflictException(
        'Remove this member from their transactions before removing them from the group',
      );
    if (
      rules.some((rule) => referencesParticipant(rule, id)) ||
      occurrences.some((occurrence) => referencesParticipant(occurrence, id))
    )
      throw new ConflictException(
        'Remove this member from their recurring rules and occurrence history before removing them from the group',
      );
  }

  public async assertExternalParticipantUnused(id: string): Promise<void> {
    const [transactions, rules, occurrences] = await this.getReferences();
    if (
      transactions.some((transaction) =>
        referencesParticipant(transaction, id),
      ) ||
      rules.some((rule) => referencesParticipant(rule, id)) ||
      occurrences.some((occurrence) => referencesParticipant(occurrence, id))
    )
      throw new ConflictException(
        'This participant is referenced by transaction or recurring history and cannot be deleted',
      );
  }

  private getReferences() {
    return Promise.all([
      this.transactions.getTransactions(),
      this.recurring.getRules(),
      this.recurring.getOccurrences(),
    ]);
  }
}

function referencesParticipant(
  record: {
    targetParticipantId: string;
    beneficiaryParticipantIds: readonly string[];
  },
  id: string,
): boolean {
  return (
    record.targetParticipantId === id ||
    record.beneficiaryParticipantIds.includes(id)
  );
}
// #endregion
