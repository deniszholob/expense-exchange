// #region Imports
import { ApiProperty } from '@nestjs/swagger';
import { UserColor } from '../auth/user-color.enum.js';
import type {
  AddGroupMember,
  GroupMemberDtoModel,
  GroupMemberProfile,
} from './group-member.schema.js';
// #endregion

// #region DTOs
export class GroupMemberDto implements GroupMemberDtoModel {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty({ required: false })
  public username?: string;

  @ApiProperty({ enum: UserColor, enumName: 'UserColor', required: false })
  public color?: UserColor;
}

export class GroupMemberProfileDto implements GroupMemberProfile {
  @ApiProperty()
  public name!: string;
}

export class AddGroupMemberDto implements AddGroupMember {
  @ApiProperty()
  public accountId!: string;
}
// #endregion
