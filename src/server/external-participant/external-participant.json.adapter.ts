// #region Imports
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonStore } from '../utils/json-store.js';
import { ExternalParticipantRepository } from './external-participant.repository.js';
import { ExternalParticipantStoreSchema } from './external-participant.schema.js';
import type {
  CreateExternalParticipant,
  ExternalParticipant,
  UpdateExternalParticipant,
} from './external-participant.schema.js';
// #endregion

// #region JSON Adapter
@Injectable()
export class ExternalParticipantJsonAdapter extends ExternalParticipantRepository {
  private readonly store = new JsonStore(
    join(process.env['DATA_DIR'] ?? '.dist/data', 'external-participants.json'),
    ExternalParticipantStoreSchema,
    () => ({ version: 1, participants: [] }),
  );

  public async getParticipants(): Promise<ExternalParticipant[]> {
    return (await this.store.read()).participants;
  }

  public async createParticipant(
    input: CreateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.store.update((store) => {
      const participant: ExternalParticipant = {
        id: `external:${randomUUID()}`,
        name: input.name,
      };
      store.participants.push(participant);
      return participant;
    });
  }

  public async updateParticipant(
    id: string,
    input: UpdateExternalParticipant,
  ): Promise<ExternalParticipant> {
    return this.store.update((store) => {
      const participant = store.participants.find((item) => item.id === id);
      if (!participant)
        throw new NotFoundException('External participant not found');
      participant.name = input.name;
      return participant;
    });
  }

  public async deleteParticipant(id: string): Promise<ExternalParticipant> {
    return this.store.update((store) => {
      const index = store.participants.findIndex((item) => item.id === id);
      if (index < 0)
        throw new NotFoundException('External participant not found');
      return store.participants.splice(index, 1)[0]!;
    });
  }
}
// #endregion
