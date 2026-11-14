// #region Types
export interface RecurringPriceSchedule {
  readonly isAutopay: boolean;
  readonly prices: readonly {
    readonly effectiveDate: string;
    readonly amount?: number | null;
  }[];
}
// #endregion

// #region Recurring Price Utilities
export function getRecurringAmountOnDate(
  rule: Pick<RecurringPriceSchedule, 'prices'>,
  date: string,
): number | undefined {
  let latestEffectiveDate: string | undefined;
  let latestAmount: number | undefined;
  for (const price of rule.prices) {
    if (
      price.effectiveDate <= date &&
      (latestEffectiveDate === undefined ||
        price.effectiveDate > latestEffectiveDate)
    ) {
      latestEffectiveDate = price.effectiveDate;
      latestAmount = price.amount ?? undefined;
    }
  }
  return latestAmount;
}

export function isFullyAutomatedRecurringRule(
  rule: RecurringPriceSchedule,
): boolean {
  return rule.isAutopay && rule.prices.every((price) => price.amount != null);
}

export function getRecurringStartDate(
  rule: Pick<RecurringPriceSchedule, 'prices'>,
): string {
  return rule.prices.reduce(
    (earliest, price) =>
      price.effectiveDate < earliest ? price.effectiveDate : earliest,
    rule.prices[0]!.effectiveDate,
  );
}
// #endregion
