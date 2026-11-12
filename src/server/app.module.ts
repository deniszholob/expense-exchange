// #region Imports
import { Module } from '@nestjs/common';

import { ApiDocsRedirectController } from './api-docs/api-docs-redirect.controller.js';
import { HealthController } from './health/health.controller.js';
import { ExpenseController } from './expenses/expense.controller.js';
import {
  ExpenseRepository,
  JsonExpenseRepository,
} from './expenses/expense.repository.js';
import { ExpenseService } from './expenses/expense.service.js';
import { GroupMembersController } from './groups/group-members.controller.js';
import { GroupMemberService } from './groups/group-member.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AdminGuard } from './auth/admin.guard.js';
import { AuthRepository, JsonAuthRepository } from './auth/auth.repository.js';
import { GroupMemberGuard } from './auth/group-member.guard.js';
// #endregion

// #region Module
@Module({
  controllers: [
    ApiDocsRedirectController,
    HealthController,
    ExpenseController,
    GroupMembersController,
    AuthController,
  ],
  providers: [
    ExpenseService,
    GroupMemberService,
    AuthService,
    AuthGuard,
    AdminGuard,
    GroupMemberGuard,
    { provide: ExpenseRepository, useClass: JsonExpenseRepository },
    { provide: AuthRepository, useClass: JsonAuthRepository },
  ],
})
export class AppModule {}
// #endregion
