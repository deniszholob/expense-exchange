// #region Imports
import type {
  CreateExternalParticipant,
  ExternalParticipant,
  UpdateExternalParticipant,
} from './external-participant.schema.js';
// #endregion

// #region Repository Contract
export abstract class ExternalParticipantRepository {
  public abstract getParticipants(): Promise<ExternalParticipant[]>;
  public abstract createParticipant(
    input: CreateExternalParticipant,
  ): Promise<ExternalParticipant>;
  public abstract updateParticipant(
    id: string,
    input: UpdateExternalParticipant,
  ): Promise<ExternalParticipant>;
  public abstract deleteParticipant(id: string): Promise<ExternalParticipant>;
}
// #endregion
