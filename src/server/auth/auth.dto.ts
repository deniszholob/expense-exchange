// #region Imports
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../util/user-role.enum.js';
// #endregion

// #region DTOs
export class AuthUserDto {
  @ApiProperty() public id!: string;
  @ApiProperty() public name!: string;
  @ApiProperty() public username!: string;
  @ApiProperty({ enum: UserRole }) public role!: UserRole;
}
export class LoginAccountDto {
  @ApiProperty() public username!: string;
  @ApiProperty({ enum: UserRole }) public role!: UserRole;
}
export class AuthStatusDto {
  @ApiProperty() public setupRequired!: boolean;
}
export class CredentialsDto {
  @ApiProperty() public username!: string;
  @ApiProperty() public password!: string;
}
export class AdminSetupDto extends CredentialsDto {
  @ApiProperty({ required: false }) public name?: string;
}
export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto }) public user!: AuthUserDto;
}
export class ProfileUpdateDto {
  @ApiProperty({ required: false }) public name?: string;
  @ApiProperty() public username!: string;
  @ApiProperty({ required: false }) public password?: string;
}
export class CreateAuthAccountDto extends CredentialsDto {
  @ApiProperty({ required: false }) public name?: string;
}
export class UpdateAuthAccountDto {
  @ApiProperty({ required: false }) public name?: string;
  @ApiProperty({ required: false }) public username?: string;
  @ApiProperty({ required: false }) public password?: string;
}
export class LogoutResponseDto {
  @ApiProperty() public success!: boolean;
}
// #endregion
