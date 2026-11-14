// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { TransactionType } from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  CreateTransactionDto,
  TransactionDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { TransactionsService } from 'src/client/api/generated/transactions/transactions.service';
import { TransactionDetailsComponent } from 'src/client/app/components/transaction-details/transaction-details.component';
import { FormFieldComponent } from 'src/client/app/components/forms/form-field/form-field.component';
import { SegmentedControlComponent } from 'src/client/app/components/forms/segmented-control/segmented-control.component';
import { TransactionTableComponent } from 'src/client/app/components/transaction-table/transaction-table.component';
import type { TransactionRow } from 'src/client/app/components/transaction-table/transaction-table.component';
import { ROUTE_KEYWORDS } from 'src/client/app/app.info';
import {
  DetailsPageDirective,
  DetailsPageState,
  PageLayoutComponent,
} from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import {
  TransactionListFilter,
  TRANSACTION_LIST_FILTER_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-list-filter.enum';
import {
  TransactionScope,
  TRANSACTION_SCOPE_INFO_OPTIONS,
} from 'src/client/app/shared/transaction-scope.enum';
import { DataRangeService } from 'src/client/app/shared/data-range.service';
import { isDateWithinRange } from 'src/client/app/shared/date-range/date-range.util';
import {
  getSessionFormDraftKey,
  removeSessionFormDraft,
} from 'src/client/app/shared/session-form-draft';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-transactions-page',
  templateUrl: './transactions-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    FormField,
    FormFieldComponent,
    TransactionDetailsComponent,
    SegmentedControlComponent,
    TransactionTableComponent,
    PageLayoutComponent,
  ],
})
export class TransactionsPageComponent extends DetailsPageDirective {
  private readonly dataRangeService = inject(DataRangeService);
  protected readonly ROUTE_KEYWORDS = ROUTE_KEYWORDS;
  protected readonly TransactionListFilter = TransactionListFilter;
  protected readonly TransactionType = TransactionType;
  protected readonly $filterData = signal({
    type: TransactionListFilter.All,
    scope: TransactionScope.Group,
  });
  protected readonly $filters = form(this.$filterData);
  protected readonly $typeOptions = TRANSACTION_LIST_FILTER_INFO_OPTIONS.map(
    ({ id, display }) => ({ value: id, label: display }),
  );
  protected readonly $newTransactionType = signal<TransactionType>(
    TransactionType.Expense,
  );
  protected readonly $scopeOptions = computed(() =>
    TRANSACTION_SCOPE_INFO_OPTIONS.map(({ id, display }) => ({
      value: id,
      label: display,
      ...(id === TransactionScope.MyShare && {
        disabled: !this.$personalScopeAvailable(),
      }),
    })),
  );
  protected readonly $totalTransactionCount = computed(
    () => this.appService.$transactions().length,
  );
  protected readonly $personalScopeAvailable = computed(() => {
    const currentUserId = this.appService.$currentUser()?.id;
    return (
      this.appService.$dataSource() !== DataSource.Local &&
      currentUserId !== undefined &&
      this.appService
        .$groupMembers()
        .some((member) => member.id === currentUserId)
    );
  });
  protected readonly $transaction = computed(() => {
    const id = this.$resourceId();
    return id
      ? this.appService.$transactions().find((item) => item.id === id)
      : undefined;
  });
  protected readonly $expenseTransactions = computed(() =>
    this.appService
      .$transactions()
      .filter((item) => item.type === TransactionType.Expense),
  );
  protected readonly $transactionRows = computed(() => {
    const participants = new Map(
      this.appService
        .$participants()
        .map((participant) => [participant.id, participant]),
    );
    const transactions = this.appService.$transactions();
    const currentUserId = this.appService.$currentUser()?.id;
    const rows: TransactionRow[] = transactions.map((transaction) => {
      const targetParticipant = participants.get(
        transaction.targetParticipantId,
      );
      const linkedName = transaction.linkedTransactionId
        ? transactions.find(
            (candidate) => candidate.id === transaction.linkedTransactionId,
          )?.name
        : undefined;
      return {
        id: transaction.id,
        kind: transaction.type,
        amount: Math.abs(transaction.amount),
        name: transaction.name,
        description: [
          transaction.linkedTransactionId
            ? `Refund for ${linkedName ?? 'linked expense'}`
            : '',
          transaction.note ?? '',
        ]
          .filter(Boolean)
          .join(' · '),
        party: {
          id: transaction.targetParticipantId,
          name: targetParticipant?.name ?? transaction.targetParticipantId,
        },
        beneficiaries: transaction.beneficiaryParticipantIds.map(
          (participantId) => ({
            id: participantId,
            name: participants.get(participantId)?.name ?? participantId,
          }),
        ),
        date: transaction.postDate,
        recordedDate: transaction.completeDate,
        rangeDate: transaction.completeDate,
        participantIds: [
          transaction.targetParticipantId,
          ...transaction.beneficiaryParticipantIds,
        ],
        canManage:
          transaction.type === TransactionType.Expense ||
          transaction.ownerUserId === currentUserId,
      };
    });
    const type = this.$filterData().type;
    const scope = this.$filterData().scope;
    return rows
      .filter((row) =>
        isDateWithinRange(row.rangeDate, this.dataRangeService.$dataRange()),
      )
      .filter((row) =>
        type === TransactionListFilter.All
          ? true
          : type === TransactionListFilter.Expense
            ? row.kind !== TransactionType.Income
            : row.kind === TransactionType.Income,
      )
      .filter(
        (row) =>
          scope !== TransactionScope.MyShare ||
          (currentUserId !== undefined &&
            row.participantIds.includes(currentUserId)),
      )
      .sort((first, second) =>
        second.recordedDate.localeCompare(first.recordedDate),
      );
  });
  private readonly $routeId = toSignal(
    this.activatedRoute.params.pipe(
      map((params) =>
        typeof params['id'] === 'string' ? params['id'] : undefined,
      ),
    ),
    { initialValue: undefined },
  );
  private readonly $resourceId = computed(() => {
    const id = this.$routeId();
    return id && id !== ROUTE_KEYWORDS.NEW_ITEM ? id : undefined;
  });
  protected readonly $pageState = computed(() => {
    const id = this.$routeId();
    if (!id) return DetailsPageState.NO_PARAMS;
    if (id === ROUTE_KEYWORDS.NEW_ITEM)
      return DetailsPageState.LOADED_PARAM_DATA;
    if (this.appService.$dataSource() === DataSource.Local)
      return this.$transaction()
        ? DetailsPageState.LOADED_PARAM_DATA
        : DetailsPageState.ERROR;
    if (this.appService.$apiError()) return DetailsPageState.ERROR;
    if (this.appService.$apiLoading()) return DetailsPageState.LOADING;
    return this.$transaction()
      ? DetailsPageState.LOADED_PARAM_DATA
      : DetailsPageState.ERROR;
  });
  protected readonly $errors = computed(() => {
    const error = this.appService.$apiError();
    return error ? [error.message] : ['Transaction not found'];
  });

  public constructor(
    protected appService: AppService,
    private readonly transactionsApi: TransactionsService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
  ) {
    super();
    const requestedType =
      this.activatedRoute.snapshot.queryParamMap.get('type');
    if (requestedType === TransactionType.Income)
      this.$newTransactionType.set(TransactionType.Income);
    else if (requestedType === TransactionType.Refund)
      this.$newTransactionType.set(TransactionType.Refund);
  }

  protected onAddTransaction(): void {
    this.router.navigate([ROUTE_KEYWORDS.NEW_ITEM], {
      relativeTo: this.activatedRoute,
    });
  }

  protected onEditTransaction(row: TransactionRow): void {
    this.router.navigate([row.id], { relativeTo: this.activatedRoute });
  }

  protected async onDeleteTransaction(row: TransactionRow): Promise<void> {
    try {
      if (this.appService.$dataSource() === DataSource.Local)
        this.appService.removeLocalTransaction(row.id);
      else {
        await firstValueFrom(
          this.transactionsApi.transactionControllerDeleteTransaction(row.id),
        );
        this.appService.refreshTransactions();
      }
    } catch (error: unknown) {
      console.error(error);
    }
  }

  protected onCancelTransaction(): void {
    this.router.navigate(['..'], { relativeTo: this.activatedRoute });
  }

  protected async onSaveTransaction(data: CreateTransactionDto): Promise<void> {
    try {
      const existing = this.$transaction();
      if (this.appService.$dataSource() === DataSource.Local) {
        const transaction: TransactionDto = {
          ...data,
          type: data.type,
          id: existing?.id ?? crypto.randomUUID(),
          ...(data.type !== TransactionType.Expense
            ? {
                ownerUserId:
                  existing?.ownerUserId ??
                  this.appService.$currentUser()?.id ??
                  'local-user',
              }
            : {}),
        };
        this.appService.upsertLocalTransaction(transaction);
      } else if (existing) {
        await firstValueFrom(
          this.transactionsApi.transactionControllerUpdateTransaction(
            existing.id,
            data,
          ),
        );
        this.appService.refreshTransactions();
      } else {
        await firstValueFrom(
          this.transactionsApi.transactionControllerCreateTransaction(data),
        );
        this.appService.refreshTransactions();
      }
      const userId = this.appService.$currentUser()?.id;
      const draftKey = userId
        ? getSessionFormDraftKey(
            'transaction',
            this.appService.$dataSource(),
            userId,
            existing?.id ?? `new-${this.$newTransactionType()}`,
          )
        : undefined;
      await this.router.navigate(['..'], { relativeTo: this.activatedRoute });
      if (draftKey) removeSessionFormDraft(draftKey);
    } catch (error: unknown) {
      console.error('Unable to save transaction', error);
    }
  }
}
// #endregion
