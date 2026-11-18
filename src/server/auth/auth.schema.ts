// #region Imports
import { z } from 'zod';
import { AuthAccountSchema } from './auth-account.schema.js';
import { UserRole } from './user-role.enum.js';
import { UserColor } from './user-color.enum.js';
// #endregion

// #region Request Schemas
export const PASSWORD_POLICY = {
  minLength: 10,
  maxLength: 200,
} as const;
export const AUTH_NAME_MAX_LENGTH = 100;
export const USERNAME_LENGTH = { min: 3, max: 64 } as const;
export const PASSWORD_RESET_CODE_LENGTH = 22;
export const PASSWORD_RESET_LIFETIME_MINUTES = 30;

const CredentialsSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  password: z
    .string()
    .min(PASSWORD_POLICY.minLength)
    .max(PASSWORD_POLICY.maxLength),
});

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  role: z.enum(UserRole),
  color: z.enum(UserColor),
});

export const LoginAccountSchema = z.object({
  username: z.string().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  role: z.enum(UserRole),
  color: z.enum(UserColor),
});

export const AuthStatusSchema = z.object({ setupRequired: z.boolean() });
export const AuthResponseSchema = z.object({ user: AuthUserSchema });
export const LogoutResponseSchema = z.object({ success: z.boolean() });

export const AdminSetupSchema = CredentialsSchema.extend({
  name: z.string().trim().max(AUTH_NAME_MAX_LENGTH).optional(),
});

export const CreateAuthAccountSchema = CredentialsSchema.extend({
  name: z.string().trim().max(AUTH_NAME_MAX_LENGTH).optional(),
});

export const UpdateAuthAccountSchema = z.object({
  name: z.string().trim().max(AUTH_NAME_MAX_LENGTH).optional(),
  username: z
    .string()
    .trim()
    .min(USERNAME_LENGTH.min)
    .max(USERNAME_LENGTH.max)
    .optional(),
  password: z
    .union([
      z.literal(''),
      z.string().min(PASSWORD_POLICY.minLength).max(PASSWORD_POLICY.maxLength),
    ])
    .optional(),
});

export const LoginCredentialsSchema = CredentialsSchema;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().max(AUTH_NAME_MAX_LENGTH).optional(),
  username: z.string().trim().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  password: z
    .union([
      z.literal(''),
      z.string().min(PASSWORD_POLICY.minLength).max(PASSWORD_POLICY.maxLength),
    ])
    .optional(),
  color: z.enum(UserColor).optional(),
});

export const FilesystemPasswordResetRequestSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
});

export const FilesystemPasswordResetCompleteSchema = z.object({
  username: z.string().trim().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  code: z.string().length(PASSWORD_RESET_CODE_LENGTH),
  password: z
    .string()
    .min(PASSWORD_POLICY.minLength)
    .max(PASSWORD_POLICY.maxLength),
});

export const FilesystemPasswordResetChallengeSchema = z.object({
  username: z.string().min(USERNAME_LENGTH.min).max(USERNAME_LENGTH.max),
  code: z.string().length(PASSWORD_RESET_CODE_LENGTH),
  expiresAt: z.number().int().positive(),
});

export const PasswordResetResponseSchema = z.object({
  success: z.boolean(),
});

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
export type FilesystemPasswordResetRequest = z.infer<
  typeof FilesystemPasswordResetRequestSchema
>;
export type FilesystemPasswordResetComplete = z.infer<
  typeof FilesystemPasswordResetCompleteSchema
>;
export type FilesystemPasswordResetChallenge = z.infer<
  typeof FilesystemPasswordResetChallengeSchema
>;
export type PasswordResetResponse = z.infer<typeof PasswordResetResponseSchema>;
// #endregion

// #region Persistence Schema
export const AuthAccountsStoreSchema = z.object({
  version: z.literal(1),
  accounts: z.array(AuthAccountSchema),
});
// #endregion
