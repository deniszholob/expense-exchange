// #region Imports
import { Injectable } from '@nestjs/common';
import { ParticipantReferenceService } from '../services/participant-reference.service.js';
import type {
  CreateExternalParticipant,
  ExternalParticipant,
  UpdateExternalParticipant,
} from './external-participant.schema.js';
import { ExternalParticipantRepository } from './external-participant.repository.js';
// #endregion

// #region Service
@Injectable()
export class ExternalParticipantService {
  public constructor(
    private readonly repository: ExternalParticipantRepository,
    private readonly participantReferences: ParticipantReferenceService,
  ) {}

  public getParticipants(): Promise<ExternalParticipant[]> {
    return this.repository.getParticipants();
  }

  public createParticipant(
    input: CreateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.repository.createParticipant(input);
  }

  public updateParticipant(
    id: string,
    input: UpdateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.repository.updateParticipant(id, input);
  }

  public async deleteParticipant(id: string): Promise<ExternalParticipant> {
    await this.participantReferences.assertExternalParticipantUnused(id);
    return this.repository.deleteParticipant(id);
  }
}
// #endregion
