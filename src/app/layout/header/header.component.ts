import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, tap } from 'rxjs';
import { PAGE_ROUTES } from 'src/app/app.info';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { AppService } from 'src/app/shared/app/app.service';
import { Link } from 'src/app/shared/link/link.model';
import { toWordCase } from 'src/app/utils';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule, RouterModule],
})
export class HeaderComponent implements OnDestroy {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  protected readonly clearSub$: Subject<void> = new Subject<void>();
  protected readonly PAGE_ROUTES = PAGE_ROUTES;
  protected links: Link[] = [];

  constructor(
    protected appService: AppService,
    protected authGuard: AuthGuard,
    private router: Router,
  ) {
    this.setAvailableLinks();
    this.appService.currentUserChange
      .pipe(
        tap(() => {
          this.setAvailableLinks();
        }),
        takeUntil(this.clearSub$),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.clearSub$.next();
    this.clearSub$.complete();
  }

  protected setAvailableLinks() {
    this.links = [];
    for (const route of this.router.config) {
      if (route.path === PAGE_ROUTES.SETTINGS_PAGE_ROOT) {
        continue;
      }
      if (!route.canActivate) {
        this.links.push(routeStringToLink(route.path ?? ''));
        continue;
      }

      if (this.authGuard.canActivate()) {
        this.links.push(routeStringToLink(route.path ?? ''));
      }

      // Handle multiple guards
      // const canActivateGuards = route.canActivate?.map((guard: any) =>
      //   inject(guard as ProviderToken<any>).canActivate(),
      // );

      // if (canActivateGuards) {
      //   const results = await Promise.all(canActivateGuards);
      //   if (results.every((res) => res === true)) {
      //     this.links.push(routeStringToLink(route.path ?? ''));
      //   }
      // }
    }
  }

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
