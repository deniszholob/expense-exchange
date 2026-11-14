// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { UserRole } from '../auth/user-role.enum.js';
import { AddGroupMemberDto, GroupMemberDto } from './group-member.dto.js';
import { GroupMemberService } from './group-member.service.js';
import { AddGroupMemberSchema } from './group-member.schema.js';
// #endregion

// #region Controller
@ApiTags('group-members')
@Controller('groups/members')
@UseGuards(AuthGuard, GroupMemberGuard)
export class GroupMembersController {
  public constructor(
    private readonly members: GroupMemberService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List group members' })
  @ApiOkResponse({ type: GroupMemberDto, isArray: true })
  public async getMembers(): Promise<GroupMemberDto[]> {
    const [members, accounts] = await Promise.all([
      this.members.getMembers(),
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

  @Post()
  @ApiOperation({ summary: 'Add an existing account to the group' })
  @ApiCreatedResponse({ type: GroupMemberDto })
  public async addMember(
    @Body() body: AddGroupMemberDto,
  ): Promise<GroupMemberDto> {
    const input = AddGroupMemberSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Select a valid account');
    const account = await this.auth.getAccount(input.data.accountId);
    if (account.role === UserRole.Admin)
      throw new ForbiddenException(
        'Administrator accounts cannot be added to the group',
      );
    const members = await this.members.getMembers();
    if (members.some((member) => member.id === input.data.accountId))
      throw new BadRequestException('This account is already in the group');
    const member = await this.members.addMember(
      { name: account.name || account.username },
      account.id,
    );
    return {
      ...member,
      username: account.username,
      color: account.color,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a member from the group' })
  @ApiOkResponse({ type: GroupMemberDto })
  public removeMember(@Param('id') id: string): Promise<GroupMemberDto> {
    return this.members.removeMember(id);
  }
}
// #endregion
