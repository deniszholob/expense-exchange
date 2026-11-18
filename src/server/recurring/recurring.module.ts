// #region Imports
import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence.module.js';
import { RecurringController } from './recurring.controller.js';
import { RecurringService } from './recurring.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule, ServicesModule, AuthModule],
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
// #endregion
