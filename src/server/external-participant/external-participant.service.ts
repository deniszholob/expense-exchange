// #region Imports
import { ConflictException, Injectable } from '@nestjs/common';
import type {
  CreateExternalParticipant,
  ExternalParticipant,
  UpdateExternalParticipant,
} from './external-participant.schema.js';
import { ExternalParticipantRepository } from './external-participant.repository.js';
import { TransactionRepository } from '../transactions/transaction.repository.js';
import { RecurringRepository } from '../recurring/recurring.repository.js';
// #endregion

// #region Service
@Injectable()
export class ExternalParticipantService {
  public constructor(
    private readonly repository: ExternalParticipantRepository,
    private readonly transactions: TransactionRepository,
    private readonly recurring: RecurringRepository,
  ) {}

  public getParticipants(): Promise<ExternalParticipant[]> {
    return this.repository.getParticipants();
  }

  public createParticipant(
    input: CreateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.repository.createParticipant(input);
  }

  public updateParticipant(
    id: string,
    input: UpdateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.repository.updateParticipant(id, input);
  }

  public async deleteParticipant(id: string): Promise<ExternalParticipant> {
    const [transactions, rules, occurrences] = await Promise.all([
      this.transactions.getTransactions(),
      this.recurring.getRules(),
      this.recurring.getOccurrences(),
    ]);
    const transactionInUse = transactions.some(
      (transaction) =>
        transaction.targetParticipantId === id ||
        transaction.beneficiaryParticipantIds.includes(id),
    );
    const ruleInUse = rules.some(
      (rule) =>
        rule.targetParticipantId === id ||
        rule.beneficiaryParticipantIds.includes(id),
    );
    const occurrenceInUse = occurrences.some(
      (occurrence) =>
        occurrence.targetParticipantId === id ||
        occurrence.beneficiaryParticipantIds.includes(id),
    );
    if (transactionInUse || ruleInUse || occurrenceInUse)
      throw new ConflictException(
        'This participant is referenced by transaction or recurring history and cannot be deleted',
      );
    return this.repository.deleteParticipant(id);
  }
}
// #endregion
