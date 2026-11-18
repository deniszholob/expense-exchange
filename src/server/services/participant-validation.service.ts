// #region Imports
import { BadRequestException, Injectable } from '@nestjs/common';

import { AuthRepository } from '../auth/auth.repository.js';
import { UserRole } from '../auth/user-role.enum.js';
import { ExternalParticipantRepository } from '../external-participant/external-participant.repository.js';
import { GroupMemberRepository } from '../group-member/group-member.repository.js';
// #endregion

// #region Service
@Injectable()
export class ParticipantValidationService {
  public constructor(
    private readonly groupMembers: GroupMemberRepository,
    private readonly accounts: AuthRepository,
    private readonly externalParticipants: ExternalParticipantRepository,
  ) {}

  public async assertCurrentGroupParticipants(
    participantIds: readonly string[],
    errorMessage: string,
  ): Promise<void> {
    const [members, accounts, externalParticipants] = await Promise.all([
      this.groupMembers.getGroupMembers(),
      this.accounts.readAccounts(),
      this.externalParticipants.getParticipants(),
    ]);
    const adminIds = new Set(
      accounts
        .filter((account) => account.role === UserRole.Admin)
        .map((account) => account.id),
    );
    const currentParticipantIds = new Set([
      ...members
        .filter((member) => !adminIds.has(member.id))
        .map((member) => member.id),
      ...externalParticipants.map((participant) => participant.id),
    ]);
    if (participantIds.some((id) => !currentParticipantIds.has(id)))
      throw new BadRequestException(errorMessage);
  }
}
// #endregion
