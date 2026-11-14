// #region Imports
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateRecurringRule,
  MarkRecurringOccurrencePaid,
  RecurringOccurrence,
  RecurringPrice,
  RecurringRule,
  UpdateRecurringRule,
} from './recurring.schema.js';
import { RecurrenceCadence } from './recurring.schema.js';
import { TransactionType } from '../../util/transaction.schema.js';
// #endregion

// #region DTOs
export class RecurringPriceDto implements RecurringPrice {
  @ApiProperty({ format: 'date' })
  public effectiveDate!: string;

  @ApiPropertyOptional({ format: 'date' })
  public payDate?: string;

  @ApiPropertyOptional({ minimum: 0, exclusiveMinimum: true })
  public amount?: number;
}

export class CreateRecurringRuleDto implements CreateRecurringRule {
  @ApiProperty({
    enum: [TransactionType.Expense, TransactionType.Income],
    enumName: 'RecurringTransactionType',
  })
  public type!: CreateRecurringRule['type'];

  @ApiProperty({ minLength: 1 })
  public name!: string;

  @ApiProperty({ type: [RecurringPriceDto] })
  public prices!: RecurringPriceDto[];

  @ApiProperty({ minLength: 1 })
  public targetParticipantId!: string;

  @ApiProperty({ type: [String], minItems: 1 })
  public beneficiaryParticipantIds!: string[];

  @ApiProperty({ enum: RecurrenceCadence, enumName: 'RecurrenceCadence' })
  public cadence!: RecurrenceCadence;

  @ApiPropertyOptional({ format: 'date' })
  public endDate?: string;

  @ApiProperty()
  public isAutopay!: boolean;

  @ApiPropertyOptional()
  public note?: string;
}

export class UpdateRecurringRuleDto
  extends CreateRecurringRuleDto
  implements UpdateRecurringRule {}

export class RecurringRuleDto
  extends CreateRecurringRuleDto
  implements RecurringRule
{
  @ApiProperty({ minLength: 1 })
  public id!: string;

  @ApiProperty({ minLength: 1 })
  public ownerUserId!: string;
}

export class RecurringOccurrenceDto implements RecurringOccurrence {
  @ApiProperty({ minLength: 1 })
  public id!: string;

  @ApiProperty({ minLength: 1 })
  public ruleId!: string;

  @ApiProperty({ minLength: 1 })
  public ownerUserId!: string;

  @ApiProperty({
    enum: [TransactionType.Expense, TransactionType.Income],
    enumName: 'RecurringTransactionType',
  })
  public type!: RecurringOccurrence['type'];

  @ApiProperty({ minLength: 1 })
  public name!: string;

  @ApiPropertyOptional({ minimum: 0, exclusiveMinimum: true })
  public amount?: number;

  @ApiProperty({ minLength: 1 })
  public targetParticipantId!: string;

  @ApiProperty({ type: [String], minItems: 1 })
  public beneficiaryParticipantIds!: string[];

  @ApiProperty({ format: 'date' })
  public statementDate!: string;

  @ApiProperty({ format: 'date' })
  public payDate!: string;

  @ApiProperty()
  public isPaid!: boolean;

  @ApiProperty()
  public isAutopay!: boolean;

  @ApiProperty()
  public isAmountVariable!: boolean;

  @ApiPropertyOptional()
  public note?: string;
}

export class MarkRecurringOccurrencePaidDto implements MarkRecurringOccurrencePaid {
  @ApiProperty({ minimum: 0, exclusiveMinimum: true })
  public amount!: number;

  @ApiProperty({ format: 'date' })
  public payDate!: string;
}
// #endregion
