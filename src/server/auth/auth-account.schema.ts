// #region Imports
import { z } from 'zod';
import { UserRole } from './user-role.enum.js';
// #endregion

// #region Schema
export const AuthAccountSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().min(3),
  role: z.enum(UserRole),
  passwordHash: z.string().min(1),
});
// #endregion

// #region Model
export type AuthAccount = z.infer<typeof AuthAccountSchema>;
// #endregion
