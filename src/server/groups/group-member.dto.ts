// #region Imports
import { ApiProperty } from '@nestjs/swagger';
// #endregion

// #region DTOs
export class GroupMemberDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty({ required: false })
  public username?: string;
}

export class GroupMemberProfileDto {
  @ApiProperty()
  public name!: string;
}

export class AddGroupMemberDto {
  @ApiProperty()
  public accountId!: string;
}
// #endregion
