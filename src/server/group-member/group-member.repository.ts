// #region Imports
import type {
  GroupMemberDto,
  GroupMemberProfileDto,
} from './group-member.dto.js';
// #endregion

// #region Repository Contract
export abstract class GroupMemberRepository {
  public abstract getGroupMembers(): Promise<GroupMemberDto[]>;
  public abstract createGroupMember(
    input: GroupMemberProfileDto,
    id: string,
  ): Promise<GroupMemberDto>;
  public abstract deleteGroupMember(id: string): Promise<GroupMemberDto>;
}
// #endregion
