// #region Imports
import { ConflictException, Injectable } from '@nestjs/common';
import { GroupMemberRepository } from './group-member.repository.js';
import { TransactionRepository } from '../transactions/transaction.repository.js';
import type {
  GroupMemberDto,
  GroupMemberProfileDto,
} from './group-member.dto.js';
// #endregion

// #region Service
@Injectable()
export class GroupMemberService {
  public constructor(
    private readonly repository: GroupMemberRepository,
    private readonly transactions: TransactionRepository,
  ) {}

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
    return this.removeMemberWhenUnused(id);
  }

  private async removeMemberWhenUnused(id: string): Promise<GroupMemberDto> {
    const transactions = await this.transactions.getTransactions();
    if (
      transactions.some(
        (transaction) =>
          transaction.targetUserId === id ||
          transaction.beneficiaryUserIds.includes(id),
      )
    )
      throw new ConflictException(
        'Remove this member from their transactions before removing them from the group',
      );
    return this.repository.deleteGroupMember(id);
  }
}
// #endregion
