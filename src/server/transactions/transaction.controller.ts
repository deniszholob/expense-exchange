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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTransactionSchema } from '../../util/transaction.schema.js';
import type {
  CreateTransaction,
  Transaction,
} from '../../util/transaction.schema.js';
import { UserRole } from '../auth/user-role.enum.js';
import { AuthGuard } from '../guards/auth.guard.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { GroupMemberService } from '../group-member/group-member.service.js';
import { ExternalParticipantService } from '../external-participant/external-participant.service.js';
import { CreateTransactionDto, TransactionDto } from './transaction.dto.js';
import { TransactionService } from './transaction.service.js';
// #endregion

// #region Controller
@ApiTags('transactions')
@Controller('transactions')
@UseGuards(AuthGuard, GroupMemberGuard)
export class TransactionController {
  public constructor(
    private readonly transactions: TransactionService,
    private readonly groupMembers: GroupMemberService,
    private readonly externalParticipants: ExternalParticipantService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List accessible transactions' })
  @ApiOkResponse({ type: TransactionDto, isArray: true })
  public getTransactions(
    @Req() request: AuthenticatedRequest,
  ): Promise<Transaction[]> {
    return this.transactions.getTransactions(request.authUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiCreatedResponse({ type: TransactionDto })
  public async createTransaction(
    @Body() body: CreateTransaction,
    @Req() request: AuthenticatedRequest,
  ): Promise<Transaction> {
    const input = validateTransaction(body);
    await this.validateGroupParticipants(input);
    await this.transactions.validateLinkedTransaction(input);
    return this.transactions.createTransaction(input, request.authUser.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiOkResponse({ type: TransactionDto })
  public async updateTransaction(
    @Param('id') id: string,
    @Body() body: CreateTransaction,
    @Req() request: AuthenticatedRequest,
  ): Promise<Transaction> {
    const input = validateTransaction(body);
    await this.validateGroupParticipants(input);
    await this.transactions.validateLinkedTransaction(input);
    return this.transactions.updateTransaction(id, input, request.authUser.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({ type: TransactionDto })
  public deleteTransaction(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Transaction> {
    return this.transactions.deleteTransaction(id, request.authUser.id);
  }

  private async validateGroupParticipants(
    input: CreateTransaction,
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
        'Transactions can only include current group participants',
      );
  }
}
// #endregion

// #region Helpers
function validateTransaction(body: CreateTransaction): CreateTransaction {
  const result = CreateTransactionSchema.safeParse(body);
  if (!result.success)
    throw new BadRequestException('Invalid transaction data');
  return result.data;
}

// #endregion
