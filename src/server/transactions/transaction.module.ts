// #region Imports
import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence.module.js';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule, ServicesModule, AuthModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
// #endregion
