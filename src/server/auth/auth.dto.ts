// #region Imports
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user-role.enum.js';
import type {
  AdminSetup,
  AuthResponse,
  AuthStatus,
  AuthUser,
  CreateAuthAccount,
  Credentials,
  LoginAccount,
  LogoutResponse,
  ProfileUpdate,
  UpdateAuthAccount,
} from './auth.schema.js';
// #endregion

// #region DTOs
export class AuthUserDto implements AuthUser {
  @ApiProperty() public id!: string;
  @ApiProperty() public name!: string;
  @ApiProperty() public username!: string;
  @ApiProperty({ enum: UserRole, enumName: 'UserRole' }) public role!: UserRole;
}
export class LoginAccountDto implements LoginAccount {
  @ApiProperty() public username!: string;
  @ApiProperty({ enum: UserRole, enumName: 'UserRole' }) public role!: UserRole;
}
export class AuthStatusDto implements AuthStatus {
  @ApiProperty() public setupRequired!: boolean;
}
export class CredentialsDto implements Credentials {
  @ApiProperty() public username!: string;
  @ApiProperty() public password!: string;
}
export class AdminSetupDto extends CredentialsDto implements AdminSetup {
  @ApiProperty({ required: false }) public name?: string;
}
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: AuthUserDto }) public user!: AuthUserDto;
}
export class ProfileUpdateDto implements ProfileUpdate {
  @ApiProperty({ required: false }) public name?: string;
  @ApiProperty() public username!: string;
  @ApiProperty({ required: false }) public password?: string;
}
export class CreateAuthAccountDto
  extends CredentialsDto
  implements CreateAuthAccount
{
  @ApiProperty({ required: false }) public name?: string;
}
export class UpdateAuthAccountDto implements UpdateAuthAccount {
  @ApiProperty({ required: false }) public name?: string;
  @ApiProperty({ required: false }) public username?: string;
  @ApiProperty({ required: false }) public password?: string;
}
export class LogoutResponseDto implements LogoutResponse {
  @ApiProperty() public success!: boolean;
}
// #endregion
