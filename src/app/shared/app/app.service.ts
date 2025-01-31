import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { Expense, ExpenseService, User } from '../../api';
import { DetailedExpense } from '../detailed-expense/detailed-expense.model';

@Injectable({ providedIn: 'root' })
export class AppService implements OnDestroy {
  private readonly clearSub$: Subject<void> = new Subject<void>();

  public readonly refreshUsers$: Subject<void> = new BehaviorSubject<void>(
    undefined,
  );
  public readonly refreshExpenses$: Subject<void> = new BehaviorSubject<void>(
    undefined,
  );

  public readonly users$: Observable<User[]> = this.fetchUsers();
  public readonly expenses$: Observable<Expense[]> = this.fetchExpenses();
  public readonly detailedExpenses$: Observable<DetailedExpense[]> =
    this.fetchDetailedExpenses();

  public _users: User[] = [];
  public _expenses: Expense[] = [];
  public _detailedExpenses: DetailedExpense[] = [];

  public currentUser?: User;
  public currentUserChange = new BehaviorSubject<User | undefined>(undefined);

  constructor(private expenseService: ExpenseService) {
    this.detailedExpenses$.subscribe();

    this.refreshUsers$.next();
    this.refreshExpenses$.next();
    this.currentUserChange
      .pipe(
        tap((user: User | undefined) => {
          this.currentUser = user;
        }),
        takeUntil(this.clearSub$),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.clearSub$.next();
    this.clearSub$.complete();
  }

  public switchUser(user: User): void {
    this.currentUser = user;
  }

  private fetchUsers(): Observable<User[]> {
    return this.refreshUsers$.pipe(
      switchMap((): Observable<User[]> => this.expenseService.getUsers()),
      tap((users: User[]): void => {
        updateArray(this._users, users);
      }),
      tap((users: User[]): void => {
        const defaultUser = users.at(0);
        if (!this.currentUser && defaultUser) {
          this.currentUserChange.next(defaultUser);
        }
      }),
      shareReplay(),
      takeUntil(this.clearSub$),
    );
  }

  private fetchExpenses(): Observable<Expense[]> {
    return this.refreshExpenses$.pipe(
      switchMap((): Observable<Expense[]> => this.expenseService.getExpenses()),
      tap((expenses: Expense[]): void => {
        updateArray(this._expenses, expenses);
      }),
      shareReplay(),
      takeUntil(this.clearSub$),
    );
  }

  private fetchDetailedExpenses(): Observable<DetailedExpense[]> {
    return combineLatest([this.users$, this.expenses$]).pipe(
      map(([users, expenses]: [User[], Expense[]]): DetailedExpense[] =>
        expensesUserIdToDetailedExpense(expenses, userArrayToMapById(users)),
      ),
      tap((detailedExpenses: DetailedExpense[]): void => {
        updateArray(this._detailedExpenses, detailedExpenses);
      }),
      shareReplay(),
      takeUntil(this.clearSub$),
    );
  }
}

function userArrayToMapById(user: User[]): Map<string, User> {
  return user.reduce<Map<string, User>>(
    (map: Map<string, User>, user: User): Map<string, User> => {
      map.set(user.id, user);
      return map;
    },
    new Map<string, User>(),
  );
}

function expenseUserIdToRender(id: string, users: Map<string, User>): User {
  return users.get(id) ?? { id, name: id };
}

function expensesUserIdToDetailedExpense(
  expenses: Expense[],
  users: Map<string, User>,
): DetailedExpense[] {
  return expenses.map((expense: Expense): DetailedExpense => {
    return {
      ...expense,
      paidByUser: expenseUserIdToRender(expense.paidByUserId, users),
      paidForUsers: expense.paidForUserIds.map(
        (id: string): User => expenseUserIdToRender(id, users),
      ),
    };
  });
}

/** Clears the array and fills values from the new array to keep the reference */
function updateArray<T>(array: T[], newArray: T[]): T[] {
  array.length = 0;
  array.push(...newArray);
  return array;
}
