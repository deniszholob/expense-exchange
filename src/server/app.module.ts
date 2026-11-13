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
// #endregion

// #region Module
@Module({
  controllers: [
    ApiDocsRedirectController,
    HealthController,
    TransactionController,
    GroupMembersController,
    AuthController,
  ],
  providers: [
    TransactionService,
    GroupMemberService,
    AuthService,
    AuthGuard,
    AdminGuard,
    GroupMemberGuard,
    { provide: TransactionRepository, useClass: TransactionJsonAdapter },
    { provide: GroupMemberRepository, useClass: GroupMemberJsonAdapter },
    { provide: AuthRepository, useClass: AuthJsonAdapter },
  ],
})
export class AppModule {}
// #endregion
