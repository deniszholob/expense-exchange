// #region Imports
import { z } from 'zod';
// #endregion

// #region Schemas
const GroupMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
});

export const GroupMemberDtoSchema = GroupMemberSchema.extend({
  username: z.string().optional(),
});

export const GroupMemberProfileSchema = z.object({ name: z.string() });

export const AddGroupMemberSchema = z.object({
  accountId: z.string().uuid(),
});

export const GroupMemberStoreSchema = z.object({
  version: z.literal(1),
  users: z.array(GroupMemberSchema),
});
// #endregion

// #region Model
export type GroupMemberStore = z.infer<typeof GroupMemberStoreSchema>;
export type GroupMemberDtoModel = z.infer<typeof GroupMemberDtoSchema>;
export type GroupMemberProfile = z.infer<typeof GroupMemberProfileSchema>;
export type AddGroupMember = z.infer<typeof AddGroupMemberSchema>;
// #endregion
