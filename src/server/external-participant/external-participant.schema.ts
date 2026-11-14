// #region Imports
import { z } from 'zod';
// #endregion

// #region Schemas
export const ExternalParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
});

export const CreateExternalParticipantSchema = z.object({
  name: z.string().trim().min(1),
});

export const UpdateExternalParticipantSchema = CreateExternalParticipantSchema;

export const ExternalParticipantStoreSchema = z.object({
  version: z.literal(1),
  participants: z.array(ExternalParticipantSchema),
});
// #endregion

// #region Models
export type ExternalParticipant = z.infer<typeof ExternalParticipantSchema>;
export type CreateExternalParticipant = z.infer<
  typeof CreateExternalParticipantSchema
>;
export type UpdateExternalParticipant = z.infer<
  typeof UpdateExternalParticipantSchema
>;
export type ExternalParticipantStore = z.infer<
  typeof ExternalParticipantStoreSchema
>;
// #endregion
