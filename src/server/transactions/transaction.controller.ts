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
import { ParticipantValidationService } from '../services/participant-validation.service.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.schema.js';
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
    private readonly participantValidation: ParticipantValidationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List accessible transactions' })
  @ApiOkResponse({ type: TransactionDto, isArray: true })
  public getTransactions(
    @CurrentUser() currentUser: AuthUser,
  ): Promise<Transaction[]> {
    return this.transactions.getTransactions(currentUser.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiCreatedResponse({ type: TransactionDto })
  public async createTransaction(
    @Body() body: CreateTransaction,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<Transaction> {
    const input = validateTransaction(body);
    await this.participantValidation.assertCurrentGroupParticipants(
      [input.targetParticipantId, ...input.beneficiaryParticipantIds],
      'Transactions can only include current group participants',
    );
    await this.transactions.validateLinkedTransaction(input);
    return this.transactions.createTransaction(input, currentUser.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiBody({ type: CreateTransactionDto })
  @ApiOkResponse({ type: TransactionDto })
  public async updateTransaction(
    @Param('id') id: string,
    @Body() body: CreateTransaction,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<Transaction> {
    const input = validateTransaction(body);
    await this.participantValidation.assertCurrentGroupParticipants(
      [input.targetParticipantId, ...input.beneficiaryParticipantIds],
      'Transactions can only include current group participants',
    );
    await this.transactions.validateLinkedTransaction(input);
    return this.transactions.updateTransaction(id, input, currentUser.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiOkResponse({ type: TransactionDto })
  public deleteTransaction(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
  ): Promise<Transaction> {
    return this.transactions.deleteTransaction(id, currentUser.id);
  }
}
// #endregion

// #region Helpers
function validateTransaction(body: CreateTransaction): CreateTransaction {
  const result = CreateTransactionSchema.safeParse(body);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues.map((issue) => {
        const field =
          issue.path.length > 0 ? issue.path.join('.') : 'transaction';
        return `${field}: ${issue.message}`;
      }),
    );
  return result.data;
}

// #endregion
