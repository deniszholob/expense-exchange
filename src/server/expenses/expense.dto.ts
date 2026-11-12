// #region Imports
import { ApiProperty } from '@nestjs/swagger';
// #endregion

// #region DTOs
export class ExpenseDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty()
  public description!: string;

  @ApiProperty()
  public amount!: number;

  @ApiProperty()
  public datePaid!: string;

  @ApiProperty()
  public forDate!: string;

  @ApiProperty()
  public paidByUserId!: string;

  @ApiProperty({ type: [String] })
  public paidForUserIds!: string[];
}

export class CreateExpenseDto {
  @ApiProperty()
  public name!: string;

  @ApiProperty()
  public description!: string;

  @ApiProperty()
  public amount!: number;

  @ApiProperty()
  public datePaid!: string;

  @ApiProperty()
  public forDate!: string;

  @ApiProperty()
  public paidByUserId!: string;

  @ApiProperty({ type: [String] })
  public paidForUserIds!: string[];
}
// #endregion
