// #region Imports
import { NgComponentOutlet, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { getPageRouteInfo, PageRoute } from 'src/client/app/app.info';
import type { PageRouteInfo } from 'src/client/app/app.info';
import { AppService } from 'src/client/app/app.service';
import { DataRangeControlComponent } from 'src/client/app/components/data-range-control/data-range-control.component';
import { DataRangeService } from 'src/client/app/shared/data-range.service';
import { RecurringStateService } from 'src/client/app/shared/recurring-state.service';
import { getEarliestDate } from 'src/client/app/shared/date-range/date-range.util';
import { UserRole } from 'src/client/api/generated/expense-exchange-api.schemas';
import { DataSource } from '../../shared/data-source.enum';
import { UserMonogramPipe } from '../../shared/user-monogram.pipe';
import { UserColorPipe } from '../../shared/user-color.pipe';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  templateUrl: './header.component.html',
  host: { class: 'contents' },
  imports: [
    NgComponentOutlet,
    NgOptimizedImage,
    DataRangeControlComponent,
    UserMonogramPipe,
    UserColorPipe,
    RouterModule,
  ],
})
export class HeaderComponent {
  protected readonly recurringState = inject(RecurringStateService);
  protected readonly $recurringAttentionCount = computed(
    () => this.recurringState.$needsAttention().length,
  );
  protected readonly $earliestTransactionDate = computed(() =>
    getEarliestDate(
      this.appService
        .$transactions()
        .map((transaction) => transaction.completeDate),
    ),
  );
  protected readonly UserRole = UserRole;
  protected readonly DataSource = DataSource;
  protected readonly PageRoute = PageRoute;
  protected readonly $links = computed(() => {
    const isLoggedIn =
      this.appService.$currentUser() !== undefined ||
      this.appService.$dataSource() === DataSource.Local;
    const links = this.router.config.flatMap((route): PageRouteInfo[] => {
      if (!route.path || route.redirectTo) return [];
      if (
        route.path === PageRoute.Recurring &&
        this.appService.$dataSource() !== DataSource.RemoteApi
      )
        return [];
      if (
        new Set<string>([
          PageRoute.Settings,
          PageRoute.Login,
          PageRoute.Profile,
        ]).has(route.path ?? '')
      ) {
        return [];
      }
      if (route.canActivate && !isLoggedIn) return [];
      if (
        route.path === PageRoute.Users &&
        this.appService.$dataSource() !== DataSource.Local &&
        this.appService.$currentUser()?.role !== UserRole.Admin
      )
        return [];
      if (
        this.appService.$dataSource() !== DataSource.Local &&
        this.appService.$currentUser()?.role === UserRole.Admin &&
        new Set<string>([
          PageRoute.Dashboard,
          PageRoute.Group,
          PageRoute.Transactions,
        ]).has(route.path ?? '')
      )
        return [];
      const routeInfo = getPageRouteInfo(route.path);
      return routeInfo ? [routeInfo] : [];
    });
    return links.sort(
      (left, right) => (left.utilityOrder ?? 0) - (right.utilityOrder ?? 0),
    );
  });

  public constructor(
    protected readonly appService: AppService,
    protected readonly dataRangeService: DataRangeService,
    private readonly router: Router,
  ) {}
}

// #endregion
