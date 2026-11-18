// #region Imports
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { UserRole } from '../auth/user-role.enum.js';
import { ParticipantReferenceService } from '../services/participant-reference.service.js';
import { GroupMemberRepository } from './group-member.repository.js';
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
    private readonly auth: AuthService,
    private readonly participantReferences: ParticipantReferenceService,
  ) {}

  public async getMembers(): Promise<GroupMemberDto[]> {
    const [members, accounts] = await Promise.all([
      this.repository.getGroupMembers(),
      this.auth.listAccounts(),
    ]);
    const adminIds = new Set(
      accounts
        .filter((account) => account.role === UserRole.Admin)
        .map((account) => account.id),
    );
    const accountsById = new Map(
      accounts.map((account) => [account.id, account]),
    );
    return members
      .filter((member) => !adminIds.has(member.id))
      .map((member) => {
        const account = accountsById.get(member.id);
        return {
          ...member,
          ...(account
            ? {
                name: account.name,
                username: account.username,
                color: account.color,
              }
            : {}),
        };
      });
  }

  public async addAccountMember(accountId: string): Promise<GroupMemberDto> {
    const account = await this.auth.getAccount(accountId);
    if (account.role === UserRole.Admin)
      throw new ForbiddenException(
        'Administrator accounts cannot be added to the group',
      );
    const members = await this.repository.getGroupMembers();
    if (members.some((member) => member.id === accountId))
      throw new BadRequestException('This account is already in the group');
    const member = await this.repository.createGroupMember(
      { name: account.name || account.username },
      account.id,
    );
    return {
      ...member,
      username: account.username,
      color: account.color,
    };
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
    await this.participantReferences.assertGroupMemberUnused(id);
    return this.repository.deleteGroupMember(id);
  }
}
// #endregion
