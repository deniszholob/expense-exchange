// #region Imports
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  LucideChartNoAxesCombined,
  LucideCode2,
  LucideDatabase,
  LucideReceipt,
  LucideUsersRound,
} from '@lucide/angular';
import { PAGE_ROUTES } from 'src/client/app/app.info';
import { AppService } from 'src/client/app/app.service';
import { Link } from 'src/client/app/shared/link/link.model';
import { toWordCase } from 'src/client/app/utils';
import { UserRole } from '../../../../util/user-role.enum';
import { DataSource } from '../../shared/data-source.enum';
import { UserMonogramPipe } from '../../shared/user-monogram.pipe';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  templateUrl: './header.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [
    CommonModule,
    NgOptimizedImage,
    UserMonogramPipe,
    RouterModule,
    LucideChartNoAxesCombined,
    LucideCode2,
    LucideDatabase,
    LucideReceipt,
    LucideUsersRound,
  ],
})
export class HeaderComponent {
  protected readonly UserRole = UserRole;
  protected readonly DataSource = DataSource;
  protected readonly PAGE_ROUTES = PAGE_ROUTES;
  protected readonly $links = computed(() => {
    const isLoggedIn =
      this.appService.$currentUser() !== undefined ||
      this.appService.$dataSource() === DataSource.Local;
    const links = this.router.config.flatMap((route): Link[] => {
      if (!route.path) return [];
      if (
        new Set<string>([
          PAGE_ROUTES.SETTINGS_PAGE_ROOT,
          PAGE_ROUTES.LOGIN_PAGE_ROOT,
          PAGE_ROUTES.PROFILE_PAGE_ROOT,
        ]).has(route.path ?? '')
      ) {
        return [];
      }
      if (route.canActivate && !isLoggedIn) return [];
      if (
        route.path === PAGE_ROUTES.USER_MANAGEMENT_PAGE_ROOT &&
        this.appService.$dataSource() !== DataSource.Local &&
        this.appService.$currentUser()?.role !== UserRole.Admin
      )
        return [];
      if (
        this.appService.$dataSource() !== DataSource.Local &&
        this.appService.$currentUser()?.role === UserRole.Admin &&
        new Set<string>([
          PAGE_ROUTES.DASHBOARD_PAGE_ROOT,
          PAGE_ROUTES.GROUP_PAGE_ROOT,
          PAGE_ROUTES.EXPENSES_PAGE_ROOT,
        ]).has(route.path ?? '')
      )
        return [];
      return [routeStringToLink(route.path ?? '')];
    });
    return links.sort(
      (left, right) => utilityOrder(left.id) - utilityOrder(right.id),
    );
  });

  public constructor(
    protected readonly appService: AppService,
    private readonly router: Router,
  ) {}
}

function routeStringToLink(route: string): Link {
  return {
    id: route,
    displayAs:
      route === PAGE_ROUTES.GROUP_PAGE_ROOT
        ? 'Group'
        : toWordCase(route.replace('_', ' ')),
  };
}

function utilityOrder(id: string): number {
  if (id === 'data') return 10;
  if (id === 'dev') return 11;
  return 0;
}

// #endregion
