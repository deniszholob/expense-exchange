// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type {
  CreateRecurringRule,
  MarkRecurringOccurrencePaid,
  RecurringOccurrence,
  RecurringRule,
  UpdateRecurringRule,
} from './recurring.schema.js';
import {
  CreateRecurringRuleSchema,
  MarkRecurringOccurrencePaidSchema,
  UpdateRecurringRuleSchema,
} from './recurring.schema.js';
import {
  CreateRecurringRuleDto,
  MarkRecurringOccurrencePaidDto,
  RecurringOccurrenceDto,
  RecurringRuleDto,
  UpdateRecurringRuleDto,
} from './recurring.dto.js';
import { RecurringService } from './recurring.service.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { GroupMemberService } from '../group-member/group-member.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UserRole } from '../auth/user-role.enum.js';
import { ExternalParticipantService } from '../external-participant/external-participant.service.js';
// #endregion

// #region Controller
@ApiTags('recurring')
@Controller('recurring')
@UseGuards(AuthGuard, GroupMemberGuard)
export class RecurringController {
  public constructor(
    private readonly recurring: RecurringService,
    private readonly groupMembers: GroupMemberService,
    private readonly externalParticipants: ExternalParticipantService,
    private readonly auth: AuthService,
  ) {}

  @Get('rules')
  @ApiOperation({ summary: 'List recurring rules visible to the current user' })
  @ApiOkResponse({ type: RecurringRuleDto, isArray: true })
  public getRules(
    @Req() request: AuthenticatedRequest,
  ): Promise<RecurringRule[]> {
    return this.recurring.getRules(request.authUser.id);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a recurring rule' })
  @ApiBody({ type: CreateRecurringRuleDto })
  @ApiCreatedResponse({ type: RecurringRuleDto })
  public async createRule(
    @Body() body: CreateRecurringRule,
    @Req() request: AuthenticatedRequest,
  ): Promise<RecurringRule> {
    const input = validateRule(body);
    await this.validateParticipants(input);
    return this.recurring.createRule(input, request.authUser.id);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update a recurring rule and selected occurrences' })
  @ApiBody({ type: UpdateRecurringRuleDto })
  @ApiOkResponse({ type: RecurringRuleDto })
  public async updateRule(
    @Param('id') id: string,
    @Body() body: UpdateRecurringRule,
    @Req() request: AuthenticatedRequest,
  ): Promise<RecurringRule> {
    const input = validateUpdateRule(body);
    await this.validateParticipants(input);
    return this.recurring.updateRule(id, input, request.authUser.id);
  }

  @Delete('rules/:id')
  @ApiOperation({
    summary:
      'End a recurring rule and optionally delete its occurrence history',
    description:
      'By default, archives the rule and preserves occurrence history. Set deleteHistory=true to permanently remove the rule and its occurrence history.',
  })
  @ApiQuery({
    name: 'deleteHistory',
    required: false,
    type: Boolean,
    description: 'Permanently delete this rule’s occurrence history.',
  })
  @ApiOkResponse({ type: RecurringRuleDto })
  public deleteRule(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Query('deleteHistory') deleteHistory?: string,
  ): Promise<RecurringRule> {
    if (
      deleteHistory !== undefined &&
      !['true', 'false'].includes(deleteHistory)
    )
      throw new BadRequestException('deleteHistory must be true or false');
    return this.recurring.deleteRule(
      id,
      request.authUser.id,
      deleteHistory === 'true',
    );
  }

  @Get('occurrences')
  @ApiOperation({
    summary:
      'List recurring occurrences and create due server-side occurrences',
  })
  @ApiOkResponse({ type: RecurringOccurrenceDto, isArray: true })
  public getOccurrences(
    @Req() request: AuthenticatedRequest,
  ): Promise<RecurringOccurrence[]> {
    return this.recurring.getOccurrences(request.authUser.id);
  }

  @Put('occurrences/:id/paid')
  @ApiOperation({
    summary: 'Record an occurrence amount and, for manual payments, its date',
  })
  @ApiBody({ type: MarkRecurringOccurrencePaidDto })
  @ApiOkResponse({ type: RecurringOccurrenceDto })
  public async markOccurrencePaid(
    @Param('id') id: string,
    @Body() body: MarkRecurringOccurrencePaid,
    @Req() request: AuthenticatedRequest,
  ): Promise<RecurringOccurrence> {
    const payment = MarkRecurringOccurrencePaidSchema.safeParse(body);
    if (!payment.success)
      throw new BadRequestException(
        'Enter a valid amount and, for manual payments, a valid payment date',
      );
    return this.recurring.markOccurrencePaid(
      id,
      payment.data,
      request.authUser.id,
    );
  }

  private async validateParticipants(
    input: CreateRecurringRule,
  ): Promise<void> {
    const [members, accounts, externalParticipants] = await Promise.all([
      this.groupMembers.getMembers(),
      this.auth.listAccounts(),
      this.externalParticipants.getParticipants(),
    ]);
    const adminIds = new Set(
      accounts
        .filter((account) => account.role === UserRole.Admin)
        .map((account) => account.id),
    );
    const memberIds = new Set(
      members
        .filter((member) => !adminIds.has(member.id))
        .map((member) => member.id)
        .concat(externalParticipants.map((participant) => participant.id)),
    );
    if (
      [input.targetParticipantId, ...input.beneficiaryParticipantIds].some(
        (id) => !memberIds.has(id),
      )
    )
      throw new BadRequestException(
        'Recurring rules can only include current group participants',
      );
  }
}
// #endregion

// #region Helpers
function validateRule(body: CreateRecurringRule): CreateRecurringRule {
  const result = CreateRecurringRuleSchema.safeParse(body);
  if (!result.success) throw invalidRecurringRuleException(result.error.issues);
  return result.data;
}

function validateUpdateRule(body: UpdateRecurringRule): UpdateRecurringRule {
  const result = UpdateRecurringRuleSchema.safeParse(body);
  if (!result.success) throw invalidRecurringRuleException(result.error.issues);
  return result.data;
}

function invalidRecurringRuleException(
  issues: { message: string; path: PropertyKey[] }[],
): BadRequestException {
  const details = issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'rule';
    return `${field}: ${issue.message}`;
  });
  return new BadRequestException(
    `Invalid recurring rule data: ${details.join('; ')}`,
  );
}
// #endregion
