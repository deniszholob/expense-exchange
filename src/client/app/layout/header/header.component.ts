// #region Imports
import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PAGE_ROUTES } from 'src/client/app/app.info';
import { AppService } from 'src/client/app/app.service';
import { Link } from 'src/client/app/shared/link/link.model';
import { toWordCase } from 'src/client/app/utils';
// #endregion

// #region Implementation

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent {
  protected readonly PAGE_ROUTES = PAGE_ROUTES;
  protected readonly $links = computed(() => {
    const isLoggedIn = this.appService.$currentUser() !== undefined;
    return this.router.config.flatMap((route): Link[] => {
      if (route.path === PAGE_ROUTES.SETTINGS_PAGE_ROOT) return [];
      if (route.canActivate && !isLoggedIn) return [];
      return [routeStringToLink(route.path ?? '')];
    });
  });

  public constructor(
    protected readonly appService: AppService,
    private readonly router: Router,
  ) {}

  protected logIn(): void {
    this.router.navigate(['/', PAGE_ROUTES.SETTINGS_PAGE_ROOT]);
  }
}

function routeStringToLink(route: string): Link {
  return {
    id: route,
    displayAs: toWordCase(route.replace('_', ' ')),
  };
}

// #endregion
