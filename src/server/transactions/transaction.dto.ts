// #region Imports
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateTransaction,
  Transaction,
} from '../../util/transaction.schema.js';
import { TransactionType } from '../../util/transaction.schema.js';
// #endregion

// #region DTOs
export class CreateTransactionDto implements CreateTransaction {
  @ApiProperty({ enum: TransactionType, enumName: 'TransactionType' })
  public type!: TransactionType;

  @ApiProperty({ minimum: 0, exclusiveMinimum: true })
  public amount!: number;

  @ApiProperty({ minLength: 1 })
  public name!: string;

  @ApiProperty({ format: 'date' })
  public postDate!: string;

  @ApiProperty({ format: 'date' })
  public completeDate!: string;

  @ApiProperty({
    minLength: 1,
    description:
      'The user who paid for an expense or received income/refund funds.',
  })
  public targetUserId!: string;

  @ApiProperty({
    type: [String],
    minItems: 1,
    description:
      'Explicit list of users who benefit from the transaction; includes targetUserId only when they benefit.',
  })
  public beneficiaryUserIds!: string[];

  @ApiPropertyOptional()
  public note?: string;

  @ApiPropertyOptional({ minLength: 1 })
  public linkedTransactionId?: string;
}

export class TransactionDto
  extends CreateTransactionDto
  implements Transaction
{
  @ApiProperty({ minLength: 1 })
  public id!: string;

  @ApiPropertyOptional({ minLength: 1 })
  public ownerUserId?: string;
}
// #endregion
