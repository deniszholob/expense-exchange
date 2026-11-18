// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { AddGroupMemberDto, GroupMemberDto } from './group-member.dto.js';
import { GroupMemberService } from './group-member.service.js';
import { AddGroupMemberSchema } from './group-member.schema.js';
// #endregion

// #region Controller
@ApiTags('group-members')
@Controller('groups/members')
@UseGuards(AuthGuard, GroupMemberGuard)
export class GroupMembersController {
  public constructor(private readonly members: GroupMemberService) {}

  @Get()
  @ApiOperation({ summary: 'List group members' })
  @ApiOkResponse({ type: GroupMemberDto, isArray: true })
  public getMembers(): Promise<GroupMemberDto[]> {
    return this.members.getMembers();
  }

  @Post()
  @ApiOperation({ summary: 'Add an existing account to the group' })
  @ApiCreatedResponse({ type: GroupMemberDto })
  public async addMember(
    @Body() body: AddGroupMemberDto,
  ): Promise<GroupMemberDto> {
    const input = AddGroupMemberSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Select a valid account');
    return this.members.addAccountMember(input.data.accountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a member from the group' })
  @ApiOkResponse({ type: GroupMemberDto })
  public removeMember(@Param('id') id: string): Promise<GroupMemberDto> {
    return this.members.removeMember(id);
  }
}
// #endregion
