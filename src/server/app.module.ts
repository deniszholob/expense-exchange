// #region Imports
import { Module } from '@nestjs/common';

import { ApiDocsRedirectController } from './api-docs-redirect.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { ExternalParticipantModule } from './external-participant/external-participant.module.js';
import { GroupMemberModule } from './group-member/group-member.module.js';
import { HealthController } from './health.controller.js';
import { RecurringModule } from './recurring/recurring.module.js';
import { TransactionModule } from './transactions/transaction.module.js';
// #endregion

// #region Module
@Module({
  imports: [
    AuthModule,
    GroupMemberModule,
    ExternalParticipantModule,
    TransactionModule,
    RecurringModule,
  ],
  controllers: [ApiDocsRedirectController, HealthController],
})
export class AppModule {}
// #endregion
