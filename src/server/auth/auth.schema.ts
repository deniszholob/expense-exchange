// #region Imports
import { z } from 'zod';
import { AuthAccountSchema } from './auth-account.schema.js';
import { UserRole } from './user-role.enum.js';
import { UserColor } from './user-color.enum.js';
// #endregion

// #region Request Schemas
const CredentialsSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(10).max(200),
});

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().min(3),
  role: z.enum(UserRole),
  color: z.enum(UserColor),
});

export const LoginAccountSchema = z.object({
  username: z.string().min(3),
  role: z.enum(UserRole),
  color: z.enum(UserColor),
});

export const AuthStatusSchema = z.object({ setupRequired: z.boolean() });
export const AuthResponseSchema = z.object({ user: AuthUserSchema });
export const LogoutResponseSchema = z.object({ success: z.boolean() });

export const AdminSetupSchema = CredentialsSchema.extend({
  name: z.string().trim().max(100).optional(),
});

export const CreateAuthAccountSchema = CredentialsSchema.extend({
  name: z.string().trim().max(100).optional(),
});

export const UpdateAuthAccountSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    username: z.string().trim().min(3).max(64).optional(),
    password: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      value.password === undefined ||
      value.password.length === 0 ||
      value.password.length >= 10,
  );

export const LoginCredentialsSchema = CredentialsSchema;

export const UpdateProfileSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    username: z.string().trim().min(3).max(64),
    password: z.string().max(200).optional(),
    color: z.enum(UserColor).optional(),
  })
  .refine(
    (value) =>
      value.password === undefined ||
      value.password.length === 0 ||
      value.password.length >= 10,
  );

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginAccount = z.infer<typeof LoginAccountSchema>;
export type AuthStatus = z.infer<typeof AuthStatusSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Credentials = z.infer<typeof LoginCredentialsSchema>;
export type AdminSetup = z.infer<typeof AdminSetupSchema>;
export type ProfileUpdate = z.infer<typeof UpdateProfileSchema>;
export type CreateAuthAccount = z.infer<typeof CreateAuthAccountSchema>;
export type UpdateAuthAccount = z.infer<typeof UpdateAuthAccountSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
// #endregion

// #region Persistence Schema
export const AuthAccountsStoreSchema = z.object({
  version: z.literal(1),
  accounts: z.array(AuthAccountSchema),
});
// #endregion
