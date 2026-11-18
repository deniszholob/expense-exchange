// #region Imports
import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence.module.js';
import { ExternalParticipantsController } from './external-participant.controller.js';
import { ExternalParticipantService } from './external-participant.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule, ServicesModule, AuthModule],
  controllers: [ExternalParticipantsController],
  providers: [ExternalParticipantService],
})
export class ExternalParticipantModule {}
// #endregion
