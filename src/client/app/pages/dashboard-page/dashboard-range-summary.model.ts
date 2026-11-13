// #region Imports
import type { GroupMemberDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import type { TransactionDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import type { DateRange } from '../../shared/date-range/date-range.model';
import { isDateWithinRange } from '../../shared/date-range/date-range.util';
// #endregion

// #region Models
export interface DashboardPaidForShare {
  paidBy: GroupMemberDto;
  paidFor: GroupMemberDto;
  amount: number;
}

export interface DashboardObligation {
  debtor: GroupMemberDto;
  creditor: GroupMemberDto;
  amount: number;
}

export interface DashboardRangeSummary {
  transactionCount: number;
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
  user: GroupMemberDto;
  amountCents: number;
}

interface DashboardPaidForShareAccumulator {
  paidBy: GroupMemberDto;
  paidFor: GroupMemberDto;
  amountCents: number;
}
// #endregion

// #region Functions
export function createDashboardRangeSummary(
  transactions: readonly TransactionDto[],
  groupMembers: readonly GroupMemberDto[],
  range: DateRange,
  personId?: string,
): DashboardRangeSummary {
  const rangedTransactions = transactions.filter((transaction) =>
    isDateWithinRange(transaction.completeDate, range),
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
  const netByUser = new Map<string, DashboardNetPosition>();
  const paidForByPair = new Map<
    string,
    Map<string, DashboardPaidForShareAccumulator>
  >();
  let totalCents = 0;
  let personalSpendingCents = 0;
  const totalIncomeCents = rangedIncome.reduce(
    (total, income) => total + Math.round(income.amount * 100),
    0,
  );
  const totalRefundCents = rangedRefunds.reduce(
    (total, refund) => total + Math.round(refund.amount * 100),
    0,
  );
  let personalIncomeCents = 0;
  let personalRefundCents = 0;

  for (const expense of rangedExpenses) {
    const paidBy = getGroupMember(expense.targetUserId, membersById);
    const beneficiaries = expense.beneficiaryUserIds
      .map((id) => getGroupMember(id, membersById))
      .sort(compareUsers);

    const amountCents = Math.round(expense.amount * 100);
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

  for (const inflow of [...rangedIncome, ...rangedRefunds]) {
    const receiver = getGroupMember(inflow.targetUserId, membersById);
    const beneficiaries = inflow.beneficiaryUserIds
      .map((id) => getGroupMember(id, membersById))
      .sort(compareUsers);
    const amountCents = Math.round(inflow.amount * 100);
    const baseShareCents = Math.floor(amountCents / beneficiaries.length);
    let remainderCents = amountCents % beneficiaries.length;
    addNetAmount(netByUser, receiver, -amountCents);
    for (const beneficiary of beneficiaries) {
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents -= remainderCents > 0 ? 1 : 0;
      addNetAmount(netByUser, beneficiary, shareCents);
      if (beneficiary.id === personId) {
        if (inflow.type === TransactionType.Income)
          personalIncomeCents += shareCents;
        if (inflow.type === TransactionType.Refund)
          personalRefundCents += shareCents;
      }
    }
  }

  const positions = [...netByUser.values()].sort(comparePositions);
  return {
    transactionCount: rangedTransactions.length,
    totalSpending: totalCents / 100,
    personalSpending: personalSpendingCents / 100,
    totalIncome: totalIncomeCents / 100,
    personalIncome: personalIncomeCents / 100,
    totalRefunds: totalRefundCents / 100,
    personalRefunds: personalRefundCents / 100,
    expenseCount: rangedExpenses.length,
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

function getGroupMember(
  id: string,
  membersById: ReadonlyMap<string, GroupMemberDto>,
): GroupMemberDto {
  return membersById.get(id) ?? { id, name: id };
}

function addNetAmount(
  netByUser: Map<string, DashboardNetPosition>,
  user: GroupMemberDto,
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
  paidBy: GroupMemberDto,
  paidFor: GroupMemberDto,
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

function compareUsers(first: GroupMemberDto, second: GroupMemberDto): number {
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
