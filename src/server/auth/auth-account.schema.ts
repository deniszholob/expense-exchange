// #region Imports
import { z } from 'zod';
import { UserRole } from './user-role.enum.js';
import { UserColor } from './user-color.enum.js';
// #endregion

// #region Schema
export const AuthAccountSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().min(3),
  role: z.enum(UserRole),
  color: z.enum(UserColor).default(UserColor.Blue),
  passwordHash: z.string().min(1),
  sessionVersion: z.number().int().nonnegative().default(0),
});
// #endregion

// #region Model
export type AuthAccount = z.infer<typeof AuthAccountSchema>;
// #endregion
