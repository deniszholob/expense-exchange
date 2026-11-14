# Expense Exchange — Design Document

## Overview

Expense Exchange is a **privacy-first** finance and shared-expense application for individuals, couples, families, or small groups.

Primary goals:

1. **Correct money math** for multi-payer + multi-beneficiary splits
2. **Low-friction** entry and daily usage
3. **Private-by-default** with explicit sharing
4. Flexible deployments: local-first, self-hosted, or cloud

---

# Product Scope

## Core Use Cases

- Track personal income/expenses privately
- Track shared expenses (e.g., household) and see **exactly who owes whom**
- Recurring bills/subscriptions/investments
- Dashboards, summaries, history, category breakdowns

## Non-goals for MVP

- Bank/Amazon/Fidelity direct sync (CSV import first)
- Fully automatic receipt scanning (assistive + confirm-first later)

---

# Privacy Model

Expense Exchange uses **Private finance + shared-only**, with _automatic visibility for involved parties_.

## Transaction Visibility

Every transaction has:

- `visibility: "private" | "shared"`
- `sharedWithUserIds: string[]` (only when shared)

### Rules

- **Private**: only the owner can view.
- **Shared**: visible to:
  - owner
  - users in `sharedWithUserIds`
  - **all involved parties** (any user directly referenced as a payer/beneficiary, or indirectly via a shared pool membership if the pool is configured as share-visible)

### Expected behavior

If Alice buys dinner for Alice and Bob, **both should see it**.

- This is ensured by automatically including all _beneficiary users_ (and optionally payers) in the viewer set for shared transactions.

## Sharing UX

- Default: private
- Toggle: share with… (multi-select)
- Optional preset: "Partner" / "Household" quick share

---

# Terminology

The following names avoid ambiguity:

- **Money Pool** (instead of “Account”): a shared or personal funding/benefit pool with defined members and weights.
  - Examples: Joint Checking Pool, Household Pool, Gift Card Pool
- **Paid Share**: an explicit contribution toward the transaction’s total.
- **Benefit Share**: an explicit allocation of who benefited.

---

# Data Model

## Entities

### User

- `id`, `email`, `displayName`
- auth fields handled by auth provider

### MoneyPool

Represents a pool that can **fund** and/or **benefit**.

- `id`, `ownerUserId?` (nullable for shared pools)
- `name`, `isShared`, `isVisibleToMembers` (privacy helper)

### MoneyPoolMember

Defines how pool usage is allocated among members.

- `poolId`, `userId`
- `weight` (normalized later; can be percent or shares)
- `role` (optional)

> Important: store a **snapshot of weights** on each transaction that uses a pool to preserve historical correctness.

### Category

- `id`, `name`, `type: expense | income | investment`

### Transaction

A transaction is the container for metadata plus funding/benefit splits.

- `id`
- `ownerUserId`
- `visibility` and `sharedWithUserIds`
- `date`, `description`, `merchant?`
- `currency`
- `totalAmountMinor` (integer in minor units, e.g., cents)
- `type: expense | income | transfer | settlement | adjustment`
- `categoryId?`
- `originalTransactionId?` (for refunds/reversals)

### PaidShare

Defines **who paid** and how much.

- `transactionId`
- `sourceType: user | pool`
- `sourceId`
- `amountMinor`

### BenefitShare

Defines **who benefited** and how much.

- `transactionId`
- `targetType: user | pool`
- `targetId`
- `amountMinor`

### PoolWeightSnapshot

Stored per transaction per pool referenced.

- `transactionId`, `poolId`
- `members: [{ userId, weight }]` (JSONB)

### RecurringRule

Template that generates stored rule occurrences on a schedule. Rule occurrences
remain separate from transactions and are not included in transaction lists or
transaction-derived balance totals.

- `id`, `ownerUserId`, `type`, `name`
- `prices: [{ effectiveDate, amount? }]`; the first effective date anchors the
  schedule, and an omitted amount means the amount varies for that cycle onward
- `targetUserId`, `beneficiaryUserIds`
- `cadence`: weekly, every two weeks, monthly, twice a year, or yearly
- optional `endDate`; no occurrences are created after this date
- the latest price effective on or before a statement date determines the
  occurrence amount
- `isAutopay`, optional `note`
- server-only `nextStatementDate` cursor to materialize each cycle once

### RuleOccurrence

Snapshot of one recurring cycle. Occurrences are generated and persisted by the
server when an authenticated client requests recurring occurrences; a
background scheduler is not required. The server enforces one occurrence per
rule and cycle date.

- `id`, `ruleId`, `ownerUserId`, `cycleDate`
- snapshots of transaction type, name, amount, payer/recipient, beneficiaries,
  autopay, and note from the rule when the occurrence is created
- `statementDate`, optional `completeDate`
- fixed-price autopay occurrences are marked complete on their statement date
  without verifying an external payment
- manual or variable-amount occurrences remain open until a user records an
  amount and payment date; payment date must be on or after statement date
- ending or deleting a rule stops future cycles and preserves created
  occurrences

The UI shows open occurrences in a separate attention list and popup. Popup
dismissal is held in memory only: unresolved items are announced again after a
page refresh/reopen and checked again on the next local day while the app stays
open. Each beneficiary sees notifications when their client is open and signed
in. A later realtime synchronization feature will make cross-user edits visible
without waiting for reload or the next occurrence refresh.

---

# Invariants (Correctness Rules)

For every transaction:

1. `sum(PaidShare.amountMinor) == totalAmountMinor`
2. `sum(BenefitShare.amountMinor) == totalAmountMinor`
3. All amounts are stored and computed in **minor units** (integers)
4. Pool allocations use the **transaction’s pool weight snapshot** (or the pool’s current weights if no snapshot exists)

---

# Balance & Settlement Computation

The app must answer both:

- **Net position** per user (owed/owes)
- **Pairwise obligations**: who owes whom how much

## Expand Pools to Users

Pool references are expanded using weights.

### Funding expansion (credits)

- User funding: credit that user
- Pool funding: distribute credit to pool members by weight

### Benefit expansion (debits)

- User benefit: debit that user
- Pool benefit: distribute debit to pool members by weight

## Per-transaction Net Positions

For each user:

- `netMinor[user] = creditMinor[user] - debitMinor[user]`

Interpretation:

- `net > 0` user is owed
- `net < 0` user owes

## Pairwise “Who owes whom” (Detailed)

From the per-transaction net positions, derive pairwise transfers:

1. Build two lists:
   - **creditors**: users with `net > 0`
   - **debtors**: users with `net < 0` (store as positive owed amount)
2. Match debtors to creditors until all settled.

This produces explicit obligations like:

- Bob → Alice: $20.00

### Notes

- This can be done **per transaction** (for detailed audit) and **aggregated across a period** (month-to-date) by summing obligations.
- Optionally optimize to minimize number of transfers, but correctness comes first.

---

# Rounding & Remainders

Because all amounts are minor-units integers, pool distributions can create remainder cents.

Deterministic remainder strategy (recommended):

- Use **largest remainder method**
  1. Compute exact fractional allocations
  2. Floor each
  3. Distribute remaining cents to members with largest fractional parts

Alternative (simpler):

- Assign remainder to the **transaction owner** or **primary payer**

---

# Security & Authentication

## Goals

- Simple, low-friction login
- Secure storage and transport

## Recommended Auth Options

### Option A (best UX): Email magic links / OTP

- User enters email, receives sign-in link or code
- No password management
- Works well for couple/family usage

### Option B: Password + optional MFA

- Standard email/password
- Add TOTP later if needed

## Security Baselines

- TLS everywhere (hosted)
- Argon2/bcrypt password hashing (if using passwords)
- Refresh tokens with rotation
- CSRF protection for cookie sessions
- Rate-limits for login endpoints
- Audit logs for auth and sharing changes

---

# UI & UX

## Theming

- **Dark theme** as default
- **Finance palette** (greens) with accessible contrast
- Theme tokens:
  - Backgrounds, surfaces, text, borders
  - Positive/negative semantics: income/expense/owed/owes
  - Category colors (optional)

Implementation (Angular + Tailwind):

- CSS variables for theme tokens
- Tailwind mapping to vars (e.g., `--color-surface`, `--color-accent`)

## Core Screens (MVP)

1. **Auth**
   - Sign in / Register (magic link or password)
2. **Home Dashboard**
   - Total income/expenses (period selector)
   - Balance summary (who owes whom)
   - Upcoming recurring
3. **Transactions**
   - Table (AG Grid): filter/sort/group by date/category/shared-with
   - Detail drawer for audit
4. **Add / Edit Transaction**
   - Amount/date/description/category
   - Paid Shares (Paid by) editor
   - Benefit Shares (For) editor
   - Share settings
5. **Balances**
   - Net per user
   - Pairwise obligations (who owes whom)
   - “Settle up” create settlement transaction
6. **Recurring**
   - List rules
   - Create/edit rule
7. **Categories**
   - Manage categories
8. **Money Pools**
   - Create/edit pool, membership weights
9. **Settings**
   - Profile, currency, export/import, data location

## Nice-to-have screens (Post-MVP)

- Budgets
- Forecast / projections
- Receipt capture
- Import wizard

---

# API Design (NestJS + OpenAPI)

All endpoints are scoped to the authenticated user.

## Auth

- `POST /auth/start` (email OTP or magic link)
- `POST /auth/verify`
- `POST /auth/logout`
- `POST /auth/refresh`

## Users

- `GET /me`
- `PATCH /me`

## Transactions

- `GET /transactions?from=&to=&q=&categoryId=&shared=true|false`
- `POST /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id` (soft delete recommended)

## Balances

- `GET /balances?from=&to=&sharedOnly=true|false`
  - returns net positions and pairwise obligations

## Money Pools

- `GET /pools`
- `POST /pools`
- `GET /pools/:id`
- `PATCH /pools/:id`
- `DELETE /pools/:id`

## Categories

- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

## Recurring

- `GET /recurring/rules`
- `POST /recurring/rules`
- `PUT /recurring/rules/:id` (schedule edits re-anchor from the updated start date; fully automated rules rebase past occurrences automatically, while other rules ask the user whether history should also be updated)
- `DELETE /recurring/rules/:id` (stops future generation and preserves history)
- `GET /recurring/occurrences` (idempotently materializes due occurrences)
- `PUT /recurring/occurrences/:id/paid`

Monthly, twice-yearly, and yearly schedules retain the original day anchor. If
the day does not exist in a shorter month, use that month's final day and resume
the original day in the next month where it exists. Twice-yearly means every
six months. Occurrences are stored in a separate recurring JSON store and never
converted into transaction records. Fully automated rules (fixed amount and
autopay) rebase past occurrences to the edited schedule and rule values. For
other rules, the client asks before applying edits to past occurrences; declining
keeps their snapshots, while confirming preserves recorded amounts and payment
dates where compatible and applies the updated schedule and rule details. An
edit is rejected if a new statement date would fall after its recorded payment
date. Future occurrences always follow the updated start date and cadence.

## Export/Import

- `GET /export/json`
- `POST /import/csv`

---

# TypeScript Types (Front-end Shared Models)

```ts
export type Visibility = 'private' | 'shared';
export type PartyType = 'user' | 'pool';
export type CurrencyCode = 'USD' | string;

export interface MoneyPoolMemberWeight {
  userId: string;
  weight: number; // normalized to sum=1
}

export interface MoneyPool {
  id: string;
  name: string;
  isShared: boolean;
  isVisibleToMembers: boolean;
}

export interface Transaction {
  id: string;
  ownerUserId: string;
  visibility: Visibility;
  sharedWithUserIds: string[];
  date: string; // ISO
  description: string;
  merchant?: string;
  currency: CurrencyCode;
  totalAmountMinor: number; // cents
  type: 'expense' | 'income' | 'transfer' | 'settlement' | 'adjustment';
  categoryId?: string;
  originalTransactionId?: string;
}

export interface PaidShare {
  transactionId: string;
  sourceType: PartyType;
  sourceId: string;
  amountMinor: number;
}

export interface BenefitShare {
  transactionId: string;
  targetType: PartyType;
  targetId: string;
  amountMinor: number;
}

export interface PoolWeightSnapshot {
  transactionId: string;
  poolId: string;
  members: MoneyPoolMemberWeight[];
}

export interface NetPositionsResult {
  netByUserId: Record<string, number>; // minor units
  obligations: Obligation[];
}

export interface Obligation {
  fromUserId: string; // debtor
  toUserId: string; // creditor
  amountMinor: number;
}
```

---

# Algorithms (Pseudocode)

## Expand shares to per-user credits/debits

```text
function computeNetForTransaction(tx, PaidShares, benefitShares, poolSnapshots, poolCurrentWeights):
  credit = map userId -> 0
  debit  = map userId -> 0

  for each funding in PaidShares:
    if funding.sourceType == 'user':
      credit[funding.sourceId] += funding.amount
    else:
      weights = getWeights(funding.sourceId, tx.id)
      alloc = distribute(funding.amount, weights)
      for each (userId, amt) in alloc:
        credit[userId] += amt

  for each benefit in benefitShares:
    if benefit.targetType == 'user':
      debit[benefit.targetId] += benefit.amount
    else:
      weights = getWeights(benefit.targetId, tx.id)
      alloc = distribute(benefit.amount, weights)
      for each (userId, amt) in alloc:
        debit[userId] += amt

  net = map userId -> (credit[userId] - debit[userId])
  return net
```

## Derive obligations (who owes whom)

```text
function computeObligationsFromNet(netByUser):
  creditors = list of (userId, amount) where amount > 0
  debtors   = list of (userId, amount) where amount < 0, store owed = -amount

  obligations = []
  i = 0; j = 0
  while i < debtors.length and j < creditors.length:
    (dId, dAmt) = debtors[i]
    (cId, cAmt) = creditors[j]

    pay = min(dAmt, cAmt)
    obligations.push({ from: dId, to: cId, amount: pay })

    dAmt -= pay
    cAmt -= pay

    update debtors[i] and creditors[j]
    if dAmt == 0: i++
    if cAmt == 0: j++

  return obligations
```

## Distribute with largest remainder (minor units)

```text
function distribute(totalMinor, weights[]):
  // weights sum to 1
  exact = weights.map(w -> totalMinor * w)
  floored = exact.map(x -> floor(x))
  remainder = totalMinor - sum(floored)

  fractions = exact - floored
  order indices by fractions desc

  alloc = floored
  for k in 0..remainder-1:
    alloc[order[k]] += 1

  return map userId -> alloc
```

---

# Database Schema (PostgreSQL Example)

Below is a relational schema that matches the entities.

## Tables

### users

- id (uuid pk)
- email (unique)
- display_name
- created_at

### money_pools

- id (uuid pk)
- name
- owner_user_id (nullable)
- is_shared (bool)
- is_visible_to_members (bool)
- created_at

### money_pool_members

- pool_id (fk)
- user_id (fk)
- weight (numeric)
- primary key (pool_id, user_id)

### categories

- id (uuid pk)
- owner_user_id (fk)
- name
- type

### transactions

- id (uuid pk)
- owner_user_id (fk)
- visibility
- shared_with_user_ids (uuid[] or join table)
- date
- description
- merchant
- currency
- total_amount_minor (bigint)
- type
- category_id (fk)
- original_transaction_id (fk nullable)
- created_at

### funding_shares

- id (uuid pk)
- transaction_id (fk)
- source_type
- source_id (uuid)
- amount_minor (bigint)

### benefit_shares

- id (uuid pk)
- transaction_id (fk)
- target_type
- target_id (uuid)
- amount_minor (bigint)

### pool_weight_snapshots

- id (uuid pk)
- transaction_id (fk)
- pool_id (fk)
- members_json (jsonb) // [{userId, weight}, ...]

### recurring_rules

- id (uuid pk)
- owner_user_id (fk)
- transaction type, template fields, cadence, start/end dates, payment delay,
  autopay state, next statement cursor

### rule_occurrences

- id (uuid pk)
- recurring_rule_id (fk)
- cycle_date (unique with recurring_rule_id)
- immutable occurrence field snapshots, statement/expected-payment dates, and
  optional completion date

## Indexing

- transactions(owner_user_id, date)
- funding_shares(transaction_id)
- benefit_shares(transaction_id)
- money_pool_members(pool_id)

---

# Dashboards, Summaries, History

## Dashboard widgets

- Period selector (week / month / year / custom)
- Total income
- Total expenses
- Net cashflow
- Shared balances (pairwise obligations)
- Category breakdown (% pie / bar)
- Upcoming recurring (next 7/30/90 days)

## History

- Transaction table grouped by month
- Filters: category, visibility, shared-with, payer/beneficiary
- Detail view shows:
  - funding breakdown
  - benefit breakdown
  - expanded per-user credits/debits
  - derived obligations

---

# Performance & Scaling

The system must remain responsive as data grows (e.g., 10+ years of transactions). The primary risk is repeatedly recalculating balances, category totals, and dashboards by scanning the full transaction history.

## Principles

1. **Default to date ranges**

   - Most views are month/quarter/year.
   - Avoid “all time” queries by default.

2. **Prefer incremental projections over full recomputation**

   - Compute expensive aggregates once on write.
   - Store results in rollup tables for fast reads.

3. **Keep write path small and deterministic**

   - A transaction typically involves only a few participants.
   - Recompute and update projections for the changed transaction only.

4. **All money amounts are integers in minor units**
   - Prevents floating error accumulation.

---

## Indexing (Baseline)

Recommended indexes for Postgres:

- `transactions(owner_user_id, date DESC)`
- `transactions(owner_user_id, visibility, date DESC)`
- `transactions(date DESC)` (if using shared households/groups later)
- `funding_shares(transaction_id)`
- `benefit_shares(transaction_id)`
- `money_pool_members(pool_id)`

For dashboards/filtering:

- `transactions(owner_user_id, category_id, date DESC)`
- If using a join table for sharing: index `(transaction_id, user_id)` and `(user_id, date)` via a denormalized “visible transactions” projection (see below).

---

## Read Performance Strategy

### Phase 1 (MVP)

Use raw transaction tables but:

- **Always query by date range** (default “this month”)
- Paginate history (AG Grid server-side row model)
- Cache computed balances for the active range in-memory (frontend) and/or short-lived server cache

This is sufficient for typical personal/couple datasets.

### Phase 2 (Recommended: Projections / Rollups)

Add **projection tables** that store precomputed totals. Reads become O(days/months) rather than O(transactions).

#### Projection A — Daily net deltas per user

`user_net_daily`

- `owner_user_id` (the ledger owner)
- `user_id` (participant)
- `date` (UTC day)
- `net_delta_minor` (bigint)

Usage:

- Net position over any range:
  - `SUM(net_delta_minor) GROUP BY user_id`

#### Projection B — Daily pairwise obligations

`user_obligation_daily`

- `owner_user_id`
- `from_user_id` (debtor)
- `to_user_id` (creditor)
- `date`
- `amount_minor`

Usage:

- “Who owes whom” over any range:
  - `SUM(amount_minor) GROUP BY from_user_id, to_user_id`

This directly answers:

- Bob → Alice: $X
- Alice → Bob: $Y

#### Projection C — Monthly category totals

`user_category_monthly`

- `owner_user_id`
- `month` (e.g., 2026-03-01)
- `category_id`
- `amount_minor`

Usage:

- Category breakdown becomes a fast GROUP BY over a small table.

---

## Write Path Strategy (Incremental Updates)

When a transaction is **created/updated/deleted**, update projections incrementally.

### Store old and new computed outputs

On update, you need both:

- previous per-user net deltas
- previous obligations list

Approaches:

1. **Recompute old from stored cache** (recommended)
   - Store `expanded_json` on the transaction containing:
     - per-user credits/debits
     - netByUser
     - obligations
2. **Recompute old from raw shares**
   - Works but costs more CPU; still acceptable if updates are rare.

### Delta update algorithm

For each transaction write:

1. Compute `netByUser` and `obligations` for the transaction.
2. Determine projection keys:
   - `dateKey = floorToDay(transaction.date)`
   - `monthKey = floorToMonth(transaction.date)`
3. Update projections:
   - For each user in netByUser:
     - upsert `user_net_daily` += netDelta
   - For each obligation:
     - upsert `user_obligation_daily` += amount
   - For categories:
     - upsert `user_category_monthly` += categoryDelta

On update:

- Apply **-old** then **+new**.

On delete:

- Apply **-old**.

All projection updates must run within the same DB transaction to keep consistency.

---

## Pool Expansion Optimization

Pool expansion (Money Pool → Users) should not be repeated on every read.

Recommended:

- On write, expand pools using the transaction’s `PoolWeightSnapshot`.
- Store results:
  - either as `expanded_json` on `transactions`
  - and/or in the rollup projections

Reads then avoid repeated pool expansion.

---

## Visibility / Sharing at Scale

If sharing grows beyond a couple users, avoid expensive OR conditions across tables.

### Option: Visible Transactions projection

Maintain a join table:

`transaction_visibility`

- `transaction_id`
- `viewer_user_id`
- `date`

On transaction write:

- compute viewer set (owner + sharedWith + involved parties)
- upsert rows

Queries become:

- `JOIN transaction_visibility tv ON tv.transaction_id = t.id WHERE tv.viewer_user_id = :me AND tv.date BETWEEN ...`

This enables:

- simple indexes
- fast pagination

---

## Partitioning (When Needed)

If datasets reach very large sizes (hundreds of thousands to millions of transactions):

- Partition `transactions` by month or year
- Consider partitioning projection tables similarly

Partitioning is not required for MVP.

---

## Caching

- Short-lived server cache for dashboard results (e.g., 30–120 seconds)
- HTTP caching for static reference data (categories, pools)
- Client-side memoization by date range

---

## Complexity Summary

Without projections:

- Dashboard for all-time: O(T \* S)

With projections:

- Dashboard for any range: O(D) or O(M) where D=days, M=months (small)
- Write cost: O(participants per transaction) (small)

---

# MVP Checklist

MVP includes:

- Auth (magic link/OTP preferred)
- Create/edit transactions with Paid Shares + Benefit Shares
- Money pools with membership weights + snapshots
- Shared visibility rules that ensure involved users see shared expenses
- Compute net positions and pairwise obligations
- Dashboard + history table
- Recurring rules + instance generation
- Export (JSON) + optional CSV import

Post-MVP:

- Budgeting
- Forecast / projections
- Receipt capture
- Bank/investment integrations
