// #region Imports
import { ApiProperty } from '@nestjs/swagger';
// #endregion

// #region DTOs
export class UserDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;
}

export class CreateUserDto {
  @ApiProperty()
  public name!: string;
}
// #endregion
