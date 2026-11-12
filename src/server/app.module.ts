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
import { UserController } from './users/user.controller.js';
import { UserService } from './users/user.service.js';
// #endregion

// #region Module
@Module({
  controllers: [
    ApiDocsRedirectController,
    HealthController,
    ExpenseController,
    UserController,
  ],
  providers: [
    ExpenseService,
    UserService,
    { provide: ExpenseRepository, useClass: JsonExpenseRepository },
  ],
})
export class AppModule {}
// #endregion
