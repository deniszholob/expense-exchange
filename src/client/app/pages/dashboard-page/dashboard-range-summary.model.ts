// #region Imports
import {
  RecurringTransactionType,
  TransactionType,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  RecurringOccurrenceDto,
  TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import type { DateRange } from '../../shared/date-range/date-range.model';
import { isDateWithinRange } from '../../shared/date-range/date-range.util';
// #endregion

// #region Models
interface DashboardParticipant {
  id: string;
  name: string;
}

export interface DashboardPaidForShare {
  paidBy: DashboardParticipant;
  paidFor: DashboardParticipant;
  amount: number;
}

export interface DashboardObligation {
  debtor: DashboardParticipant;
  creditor: DashboardParticipant;
  amount: number;
}

export interface DashboardRangeSummary {
  activityCount: number;
  totalSpending: number;
  personalSpending: number;
  totalIncome: number;
  personalIncome: number;
  totalRefunds: number;
  personalRefunds: number;
  expenseCount: number;
  paidForShares: DashboardPaidForShare[];
  obligations: DashboardObligation[];
}

interface DashboardNetPosition {
  user: DashboardParticipant;
  amountCents: number;
}

interface DashboardPaidForShareAccumulator {
  paidBy: DashboardParticipant;
  paidFor: DashboardParticipant;
  amountCents: number;
}
// #endregion

// #region Functions
export function createDashboardRangeSummary(
  transactions: readonly TransactionDto[],
  recurringOccurrences: readonly RecurringOccurrenceDto[],
  groupMembers: readonly DashboardParticipant[],
  range: DateRange,
  personId?: string,
): DashboardRangeSummary {
  const rangedTransactions = transactions.filter((transaction) =>
    isDateWithinRange(transaction.completeDate, range),
  );
  const rangedPaidOccurrences = recurringOccurrences.filter(
    (occurrence) =>
      occurrence.isPaid &&
      occurrence.amount !== undefined &&
      isDateWithinRange(occurrence.payDate, range),
  );
  const membersById = new Map(
    groupMembers.map((member) => [member.id, member]),
  );
  const rangedExpenses = rangedTransactions.filter(
    (transaction) => transaction.type === TransactionType.Expense,
  );
  const rangedIncome = rangedTransactions.filter(
    (transaction) => transaction.type === TransactionType.Income,
  );
  const rangedRefunds = rangedTransactions.filter(
    (transaction) => transaction.type === TransactionType.Refund,
  );
  const rangedRecurringExpenses = rangedPaidOccurrences.filter(
    (occurrence) => occurrence.type === RecurringTransactionType.Expense,
  );
  const rangedRecurringIncome = rangedPaidOccurrences.filter(
    (occurrence) => occurrence.type === RecurringTransactionType.Income,
  );
  const netByUser = new Map<string, DashboardNetPosition>();
  const paidForByPair = new Map<
    string,
    Map<string, DashboardPaidForShareAccumulator>
  >();
  let totalCents = 0;
  let personalSpendingCents = 0;
  const totalIncomeCents = rangedIncome.reduce(
    (total, income) => total + Math.round(income.amount * 100),
    rangedRecurringIncome.reduce(
      (total, income) => total + Math.round((income.amount ?? 0) * 100),
      0,
    ),
  );
  const totalRefundCents = rangedRefunds.reduce(
    (total, refund) => total + Math.round(refund.amount * 100),
    0,
  );
  let personalIncomeCents = 0;
  let personalRefundCents = 0;

  for (const expense of [...rangedExpenses, ...rangedRecurringExpenses]) {
    const paidBy = getParticipant(expense.targetParticipantId, membersById);
    const beneficiaries = expense.beneficiaryParticipantIds
      .map((id) => getParticipant(id, membersById))
      .sort(compareUsers);

    const amountCents = Math.round((expense.amount ?? 0) * 100);
    totalCents += amountCents;
    addNetAmount(netByUser, paidBy, amountCents);

    const baseShareCents = Math.floor(amountCents / beneficiaries.length);
    let remainderCents = amountCents % beneficiaries.length;
    for (const beneficiary of beneficiaries) {
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents -= remainderCents > 0 ? 1 : 0;
      addNetAmount(netByUser, beneficiary, -shareCents);
      if (beneficiary.id !== paidBy.id)
        addPaidForShare(paidForByPair, paidBy, beneficiary, shareCents);
      if (beneficiary.id === personId) personalSpendingCents += shareCents;
    }
  }

  for (const inflow of [
    ...rangedIncome,
    ...rangedRefunds,
    ...rangedRecurringIncome,
  ]) {
    const receiver = getParticipant(inflow.targetParticipantId, membersById);
    const beneficiaries = inflow.beneficiaryParticipantIds
      .map((id) => getParticipant(id, membersById))
      .sort(compareUsers);
    const amountCents = Math.round((inflow.amount ?? 0) * 100);
    const baseShareCents = Math.floor(amountCents / beneficiaries.length);
    let remainderCents = amountCents % beneficiaries.length;
    addNetAmount(netByUser, receiver, -amountCents);
    for (const beneficiary of beneficiaries) {
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents -= remainderCents > 0 ? 1 : 0;
      addNetAmount(netByUser, beneficiary, shareCents);
      if (beneficiary.id === personId) {
        if (inflow.type !== TransactionType.Refund)
          personalIncomeCents += shareCents;
        if (inflow.type === TransactionType.Refund)
          personalRefundCents += shareCents;
      }
    }
  }

  const positions = [...netByUser.values()].sort(comparePositions);
  return {
    activityCount: rangedTransactions.length + rangedPaidOccurrences.length,
    totalSpending: totalCents / 100,
    personalSpending: personalSpendingCents / 100,
    totalIncome: totalIncomeCents / 100,
    personalIncome: personalIncomeCents / 100,
    totalRefunds: totalRefundCents / 100,
    personalRefunds: personalRefundCents / 100,
    expenseCount: rangedExpenses.length + rangedRecurringExpenses.length,
    paidForShares: [...paidForByPair.values()]
      .flatMap((shares) => [...shares.values()])
      .map(({ paidBy, paidFor, amountCents }) => ({
        paidBy,
        paidFor,
        amount: amountCents / 100,
      }))
      .sort(comparePaidForShares),
    obligations: createObligations(positions),
  };
}

function getParticipant(
  id: string,
  membersById: ReadonlyMap<string, DashboardParticipant>,
): DashboardParticipant {
  return membersById.get(id) ?? { id, name: id };
}

function addNetAmount(
  netByUser: Map<string, DashboardNetPosition>,
  user: DashboardParticipant,
  amountCents: number,
): void {
  const position = netByUser.get(user.id);
  netByUser.set(user.id, {
    user: position?.user ?? user,
    amountCents: (position?.amountCents ?? 0) + amountCents,
  });
}

function addPaidForShare(
  sharesByPayer: Map<string, Map<string, DashboardPaidForShareAccumulator>>,
  paidBy: DashboardParticipant,
  paidFor: DashboardParticipant,
  amountCents: number,
): void {
  const sharesByBeneficiary = sharesByPayer.get(paidBy.id) ?? new Map();
  const currentShare = sharesByBeneficiary.get(paidFor.id);
  sharesByBeneficiary.set(paidFor.id, {
    paidBy: currentShare?.paidBy ?? paidBy,
    paidFor: currentShare?.paidFor ?? paidFor,
    amountCents: (currentShare?.amountCents ?? 0) + amountCents,
  });
  sharesByPayer.set(paidBy.id, sharesByBeneficiary);
}

function createObligations(
  positions: readonly DashboardNetPosition[],
): DashboardObligation[] {
  const debtors = positions
    .filter((position) => position.amountCents < 0)
    .map((position) => ({ ...position, amountCents: -position.amountCents }));
  const creditors = positions.filter((position) => position.amountCents > 0);
  const obligations: DashboardObligation[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    if (!debtor || !creditor) break;
    const amountCents = Math.min(debtor.amountCents, creditor.amountCents);
    obligations.push({
      debtor: debtor.user,
      creditor: creditor.user,
      amount: amountCents / 100,
    });
    debtor.amountCents -= amountCents;
    creditor.amountCents -= amountCents;
    if (debtor.amountCents === 0) debtorIndex++;
    if (creditor.amountCents === 0) creditorIndex++;
  }

  return obligations;
}

function compareUsers(
  first: DashboardParticipant,
  second: DashboardParticipant,
): number {
  return (
    first.name.localeCompare(second.name) || first.id.localeCompare(second.id)
  );
}

function comparePositions(
  first: DashboardNetPosition,
  second: DashboardNetPosition,
): number {
  return compareUsers(first.user, second.user);
}

function comparePaidForShares(
  first: DashboardPaidForShare,
  second: DashboardPaidForShare,
): number {
  return (
    compareUsers(first.paidBy, second.paidBy) ||
    compareUsers(first.paidFor, second.paidFor)
  );
}
// #endregion
