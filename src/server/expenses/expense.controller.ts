// #region Imports
import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { CreateExpenseDto, ExpenseDto } from './expense.dto.js';
import { ExpenseService } from './expense.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { GroupMemberGuard } from '../auth/group-member.guard.js';
import { GroupMemberService } from '../groups/group-member.service.js';
import { UserRole } from '../../util/user-role.enum.js';
// #endregion

// #region Validation
const CreateExpenseSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  amount: z.number().finite(),
  datePaid: z.string().date(),
  forDate: z.string().date(),
  paidByUserId: z.string().min(1),
  paidForUserIds: z.array(z.string().min(1)),
});
// #endregion

// #region Controller
@ApiTags('expenses')
@Controller()
@UseGuards(AuthGuard, GroupMemberGuard)
export class ExpenseController {
  public constructor(
    private readonly service: ExpenseService,
    private readonly groupMembers: GroupMemberService,
    private readonly auth: AuthService,
  ) {}

  @Get('expenses')
  @ApiOperation({ summary: 'List expenses' })
  @ApiOkResponse({ type: ExpenseDto, isArray: true })
  public getExpenses(): Promise<ExpenseDto[]> {
    return this.service.getExpenses();
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get an expense' })
  @ApiOkResponse({ type: ExpenseDto })
  public getExpense(@Param('id') id: string): Promise<ExpenseDto> {
    return this.service.getExpense(id);
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Create an expense' })
  @ApiCreatedResponse({ type: ExpenseDto })
  public createExpense(@Body() body: CreateExpenseDto): Promise<ExpenseDto> {
    return this.createValidatedExpense(body);
  }

  @Put('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiOkResponse({ type: ExpenseDto })
  public updateExpense(
    @Param('id') id: string,
    @Body() body: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.updateValidatedExpense(id, body);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiOkResponse({ type: ExpenseDto })
  public deleteExpense(@Param('id') id: string): Promise<ExpenseDto> {
    return this.service.deleteExpense(id);
  }

  private async createValidatedExpense(
    body: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    const input = validateCreateExpense(body);
    await this.validateGroupParticipants(input);
    return this.service.createExpense(input);
  }

  private async updateValidatedExpense(
    id: string,
    body: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    const input = validateCreateExpense(body);
    await this.validateGroupParticipants(input);
    return this.service.updateExpense(id, input);
  }

  private async validateGroupParticipants(
    input: CreateExpenseDto,
  ): Promise<void> {
    const [members, accounts] = await Promise.all([
      this.groupMembers.getMembers(),
      this.auth.listAccounts(),
    ]);
    const adminIds = new Set(
      accounts
        .filter((account) => account.role === UserRole.Admin)
        .map((account) => account.id),
    );
    const memberIds = new Set(
      members
        .filter((member) => !adminIds.has(member.id))
        .map((member) => member.id),
    );
    const participantIds = [input.paidByUserId, ...input.paidForUserIds];
    if (participantIds.some((id) => !memberIds.has(id)))
      throw new BadRequestException(
        'Expenses can only include current group members',
      );
  }
}
// #endregion

// #region Helpers
function validateCreateExpense(body: CreateExpenseDto): CreateExpenseDto {
  const result = CreateExpenseSchema.safeParse(body);
  if (!result.success) throw new BadRequestException('Invalid expense data');
  return result.data;
}
// #endregion
