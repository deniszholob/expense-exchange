// #region Imports
import { Module } from '@nestjs/common';

import { ApiDocsRedirectController } from './api-docs-redirect.controller.js';
import { HealthController } from './health.controller.js';
import { GroupMembersController } from './group-member/group-member.controller.js';
import { GroupMemberService } from './group-member/group-member.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AuthGuard } from './guards/auth.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { AuthRepository } from './auth/auth.repository.js';
import { AuthJsonAdapter } from './auth/auth.json.adapter.js';
import { GroupMemberGuard } from './guards/group-member.guard.js';
import { TransactionController } from './transactions/transaction.controller.js';
import { TransactionRepository } from './transactions/transaction.repository.js';
import { TransactionJsonAdapter } from './transactions/transaction.json.adapter.js';
import { TransactionService } from './transactions/transaction.service.js';
import { GroupMemberRepository } from './group-member/group-member.repository.js';
import { GroupMemberJsonAdapter } from './group-member/group-member.json.adapter.js';
import { RecurringController } from './recurring/recurring.controller.js';
import { RecurringService } from './recurring/recurring.service.js';
import { RecurringRepository } from './recurring/recurring.repository.js';
import { RecurringJsonAdapter } from './recurring/recurring.json.adapter.js';
import { ExternalParticipantsController } from './external-participant/external-participant.controller.js';
import { ExternalParticipantService } from './external-participant/external-participant.service.js';
import { ExternalParticipantRepository } from './external-participant/external-participant.repository.js';
import { ExternalParticipantJsonAdapter } from './external-participant/external-participant.json.adapter.js';
// #endregion

// #region Module
@Module({
  controllers: [
    ApiDocsRedirectController,
    HealthController,
    TransactionController,
    GroupMembersController,
    AuthController,
    RecurringController,
    ExternalParticipantsController,
  ],
  providers: [
    TransactionService,
    GroupMemberService,
    AuthService,
    RecurringService,
    ExternalParticipantService,
    AuthGuard,
    AdminGuard,
    GroupMemberGuard,
    { provide: TransactionRepository, useClass: TransactionJsonAdapter },
    { provide: GroupMemberRepository, useClass: GroupMemberJsonAdapter },
    { provide: AuthRepository, useClass: AuthJsonAdapter },
    { provide: RecurringRepository, useClass: RecurringJsonAdapter },
    {
      provide: ExternalParticipantRepository,
      useClass: ExternalParticipantJsonAdapter,
    },
  ],
})
export class AppModule {}
// #endregion
