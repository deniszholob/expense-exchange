// #region Imports
import {
  DestroyRef,
  Injector,
  Injectable,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  UserRole,
  type CreateRecurringRuleDto,
  type MarkRecurringOccurrencePaidDto,
  type RecurringOccurrenceDto,
  type RecurringRuleDto,
  type UpdateRecurringRuleDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import type { RecurringService } from 'src/client/api/generated/recurring/recurring.service';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { getHttpErrorMessage } from 'src/client/app/shared/http-error-message';
// #endregion

// #region Constants
const NEXT_DAY_CHECK_MAX_DELAY_MS = 2_147_000_000;

interface RecurringPopupItem {
  readonly ruleId: string;
  readonly name: string;
  readonly count: number;
}
// #endregion

// #region Service
@Injectable({ providedIn: 'root' })
export class RecurringStateService {
  private readonly appService = inject(AppService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seenPopupKeys = new Set<string>();
  private activeUserId: string | undefined;
  private popupDate: string | undefined;
  private nextDayTimeoutId: number | undefined;
  private requestId = 0;
  private recurringApiPromise: Promise<RecurringService> | undefined;

  public readonly $rules = signal<RecurringRuleDto[]>([]);
  public readonly $occurrences = signal<RecurringOccurrenceDto[]>([]);
  public readonly $today = signal(getLocalDate());
  public readonly $isLoading = signal(false);
  public readonly $hasLoaded = signal(false);
  public readonly $error = signal<string | undefined>(undefined);
  public readonly $popupItems = signal<RecurringPopupItem[]>([]);
  public readonly $popupOpen = signal(false);
  public readonly $needsAttention = computed(() =>
    this.$occurrences().filter(isOccurrenceNeedingAttention),
  );

  public constructor() {
    effect(() => {
      const user = this.appService.$currentUser();
      const isRemote = this.appService.$dataSource() === DataSource.RemoteApi;
      const userId =
        isRemote && user?.role === UserRole.User ? user.id : undefined;
      if (userId === this.activeUserId) return;

      this.activeUserId = userId;
      this.requestId++;
      this.seenPopupKeys.clear();
      this.popupDate = undefined;
      this.$rules.set([]);
      this.$occurrences.set([]);
      this.$hasLoaded.set(false);
      this.$error.set(undefined);
      this.$popupItems.set([]);
      this.$popupOpen.set(false);
      this.clearNextDayCheck();

      if (userId) {
        void this.refresh(true);
        this.scheduleNextDayCheck();
      }
    });

    this.destroyRef.onDestroy(() => this.clearNextDayCheck());
  }

  public async refresh(showPopup: boolean): Promise<void> {
    if (!this.activeUserId) return;
    const requestId = ++this.requestId;
    this.$isLoading.set(true);
    this.$error.set(undefined);
    try {
      const api = await this.getApi();
      const [rules, occurrences] = await Promise.all([
        firstValueFrom(api.recurringControllerGetRules()),
        firstValueFrom(api.recurringControllerGetOccurrences()),
      ]);
      if (requestId !== this.requestId) return;
      this.$rules.set(rules);
      this.$occurrences.set(occurrences);
      this.$hasLoaded.set(true);
      if (showPopup) this.openPopupForNewAttention(occurrences);
    } catch (error: unknown) {
      if (requestId !== this.requestId) return;
      this.$error.set(
        getHttpErrorMessage(error, 'Unable to load recurring data.'),
      );
    } finally {
      if (requestId === this.requestId) this.$isLoading.set(false);
    }
  }

  public async createRule(input: CreateRecurringRuleDto): Promise<void> {
    const api = await this.getApi();
    await firstValueFrom(api.recurringControllerCreateRule(input));
    await this.refresh(true);
  }

  public async updateRule(
    id: string,
    input: CreateRecurringRuleDto,
  ): Promise<void> {
    const api = await this.getApi();
    const update: UpdateRecurringRuleDto = input;
    await firstValueFrom(api.recurringControllerUpdateRule(id, update));
    await this.refresh(true);
  }

  public async endRule(id: string, deleteHistory: boolean): Promise<void> {
    const api = await this.getApi();
    await firstValueFrom(
      api.recurringControllerDeleteRule(id, { deleteHistory }),
    );
    await this.refresh(true);
  }

  public async markPaid(
    id: string,
    payment: MarkRecurringOccurrencePaidDto,
  ): Promise<void> {
    const api = await this.getApi();
    await firstValueFrom(
      api.recurringControllerMarkOccurrencePaid(id, payment),
    );
    await this.refresh(false);
  }

  public dismissPopup(): void {
    this.$popupOpen.set(false);
    this.$popupItems.set([]);
  }

  private openPopupForNewAttention(
    occurrences: RecurringOccurrenceDto[],
  ): void {
    const today = this.$today();
    if (this.popupDate !== today) {
      this.popupDate = today;
      this.$popupItems.set([]);
    }
    const unseen = occurrences.filter((occurrence) => {
      if (!isOccurrenceNeedingAttention(occurrence)) return false;
      const popupKey = `${today}:${occurrence.id}`;
      if (this.seenPopupKeys.has(popupKey)) return false;
      this.seenPopupKeys.add(popupKey);
      return true;
    });
    if (unseen.length === 0) return;

    const groupedItems = new Map(
      this.$popupItems().map((item) => [item.ruleId, item]),
    );
    for (const occurrence of unseen) {
      const existing = groupedItems.get(occurrence.ruleId);
      groupedItems.set(occurrence.ruleId, {
        ruleId: occurrence.ruleId,
        name: occurrence.name,
        count: (existing?.count ?? 0) + 1,
      });
    }
    this.$popupItems.set([...groupedItems.values()]);
    this.$popupOpen.set(true);
  }

  private scheduleNextDayCheck(): void {
    this.clearNextDayCheck();
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    const delay = Math.max(1, nextDay.getTime() - now.getTime());
    this.nextDayTimeoutId = window.setTimeout(
      () => {
        this.$today.set(getLocalDate());
        void this.refresh(true).finally(() => this.scheduleNextDayCheck());
      },
      Math.min(delay, NEXT_DAY_CHECK_MAX_DELAY_MS),
    );
  }

  private clearNextDayCheck(): void {
    if (this.nextDayTimeoutId === undefined) return;
    window.clearTimeout(this.nextDayTimeoutId);
    this.nextDayTimeoutId = undefined;
  }

  private getApi(): Promise<RecurringService> {
    this.recurringApiPromise ??=
      import('src/client/api/generated/recurring/recurring.service').then(
        ({ RecurringService: ApiService }) =>
          runInInjectionContext(this.injector, () => inject(ApiService)),
      );
    return this.recurringApiPromise;
  }
}
// #endregion

// #region Helpers
function isOccurrenceNeedingAttention(
  occurrence: RecurringOccurrenceDto,
): boolean {
  return (
    !occurrence.isPaid &&
    (!occurrence.isAutopay || occurrence.amount === undefined)
  );
}

function getLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// #endregion
