import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { PAGE_ROUTES } from '../app.info';
import { AppService } from '../shared/app/app.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private appService: AppService,
    private router: Router,
  ) {}

  public canActivate(): boolean {
    if (this.appService.currentUser) {
      return true; // Allow access if the user is authenticated
    } else {
      this.router.navigate(['/', PAGE_ROUTES.SETTINGS_PAGE_ROOT]); // Redirect to login if not authenticated
      return false; // Prevent access to the route
    }
  }
}
