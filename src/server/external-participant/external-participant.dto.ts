// #region Imports
import { ApiProperty } from '@nestjs/swagger';
import type {
  CreateExternalParticipant,
  ExternalParticipant,
  UpdateExternalParticipant,
} from './external-participant.schema.js';
// #endregion

// #region DTOs
export class ExternalParticipantDto implements ExternalParticipant {
  @ApiProperty({ minLength: 1 })
  public id!: string;

  @ApiProperty({ minLength: 1 })
  public name!: string;
}

export class CreateExternalParticipantDto implements CreateExternalParticipant {
  @ApiProperty({ minLength: 1 })
  public name!: string;
}

export class UpdateExternalParticipantDto implements UpdateExternalParticipant {
  @ApiProperty({ minLength: 1 })
  public name!: string;
}
// #endregion
