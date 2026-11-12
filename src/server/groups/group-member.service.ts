// #region Imports
import { Injectable } from '@nestjs/common';
import { ExpenseRepository } from '../expenses/expense.repository.js';
import type {
  GroupMemberDto,
  GroupMemberProfileDto,
} from './group-member.dto.js';
// #endregion

// #region Service
@Injectable()
export class GroupMemberService {
  public constructor(private readonly repository: ExpenseRepository) {}

  public getMembers(): Promise<GroupMemberDto[]> {
    return this.repository.getGroupMembers();
  }

  public addMember(
    input: GroupMemberProfileDto,
    id: string,
  ): Promise<GroupMemberDto> {
    return this.repository.createGroupMember(input, id);
  }

  public removeMember(id: string): Promise<GroupMemberDto> {
    return this.repository.deleteGroupMember(id);
  }
}
// #endregion
