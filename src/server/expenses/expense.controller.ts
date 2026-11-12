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
export class ExpenseController {
  public constructor(private readonly service: ExpenseService) {}

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
    const input = validateCreateExpense(body);
    return this.service.createExpense(input);
  }

  @Put('expenses/:id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiOkResponse({ type: ExpenseDto })
  public updateExpense(
    @Param('id') id: string,
    @Body() body: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    const input = validateCreateExpense(body);
    return this.service.updateExpense(id, input);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiOkResponse({ type: ExpenseDto })
  public deleteExpense(@Param('id') id: string): Promise<ExpenseDto> {
    return this.service.deleteExpense(id);
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
