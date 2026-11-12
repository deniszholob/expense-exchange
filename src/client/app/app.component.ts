// #region Imports
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { APP_BUILD_DATE, APP_BUILD_VERSION } from './app.build';
import { HeaderComponent } from './layout';
import { isRememberedPageUrl, LAST_PAGE_SESSION_KEY } from './shared/last-page';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, HeaderComponent, RouterModule],
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly APP_BUILD_DATE: number = APP_BUILD_DATE;
  protected readonly APP_BUILD_VERSION: string = APP_BUILD_VERSION;

  public constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (!isRememberedPageUrl(event.urlAfterRedirects)) return;
        try {
          window.sessionStorage.setItem(
            LAST_PAGE_SESSION_KEY,
            event.urlAfterRedirects,
          );
        } catch {
          // Keep routing functional when browser storage is unavailable.
        }
      });
  }
}

// #endregion
