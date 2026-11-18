// #region Imports
import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence.module.js';
import { ParticipantReferenceService } from './participant-reference.service.js';
import { ParticipantValidationService } from './participant-validation.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule],
  providers: [ParticipantReferenceService, ParticipantValidationService],
  exports: [ParticipantReferenceService, ParticipantValidationService],
})
export class ServicesModule {}
// #endregion
