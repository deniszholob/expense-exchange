// #region Imports
import { Module } from '@nestjs/common';

import { AuthJsonAdapter } from './auth/auth.json.adapter.js';
import { AuthRepository } from './auth/auth.repository.js';
import { ExternalParticipantJsonAdapter } from './external-participant/external-participant.json.adapter.js';
import { ExternalParticipantRepository } from './external-participant/external-participant.repository.js';
import { GroupMemberJsonAdapter } from './group-member/group-member.json.adapter.js';
import { GroupMemberRepository } from './group-member/group-member.repository.js';
import { RecurringJsonAdapter } from './recurring/recurring.json.adapter.js';
import { RecurringRepository } from './recurring/recurring.repository.js';
import { TransactionJsonAdapter } from './transactions/transaction.json.adapter.js';
import { TransactionRepository } from './transactions/transaction.repository.js';
// #endregion

// #region Module
@Module({
  providers: [
    { provide: AuthRepository, useClass: AuthJsonAdapter },
    { provide: GroupMemberRepository, useClass: GroupMemberJsonAdapter },
    { provide: TransactionRepository, useClass: TransactionJsonAdapter },
    { provide: RecurringRepository, useClass: RecurringJsonAdapter },
    {
      provide: ExternalParticipantRepository,
      useClass: ExternalParticipantJsonAdapter,
    },
  ],
  exports: [
    AuthRepository,
    GroupMemberRepository,
    TransactionRepository,
    RecurringRepository,
    ExternalParticipantRepository,
  ],
})
export class PersistenceModule {}
// #endregion
