// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { PageRoute } from 'src/client/app/app.info';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import {
  FormFieldComponent,
  FormFieldIcon,
} from '../../components/forms/form-field/form-field.component';
import { AuthAccountSelectorComponent } from '../../components/auth-account-selector/auth-account-selector.component';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    PageLayoutComponent,
    FormField,
    FormFieldComponent,
    AuthAccountSelectorComponent,
    RouterLink,
  ],
})
export class LoginPageComponent {
  protected readonly FormFieldIcon = FormFieldIcon;
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  protected readonly $setupRequired = this.appService.$authSetupRequired;
  protected readonly $loginAccounts = this.appService.$loginAccounts;
  protected readonly $credentials = signal({
    username: '',
    password: '',
  });
  protected readonly $form = form(this.$credentials, (path) => {
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
    required(path.password);
    minLength(path.password, 10);
    maxLength(path.password, 200);
  });
  protected readonly $loading = signal(false);
  protected readonly $error = this.appService.$authError;
  protected readonly $authStatusReady = this.appService.$authStatusReady;
  protected readonly $localMode = this.appService.$dataSource;
  protected readonly DataSource = DataSource;

  public constructor() {
    if (!this.appService.$dataSourceConfigured()) {
      void this.router.navigate(['/', PageRoute.Data]);
      return;
    }
    if (this.appService.$dataSource() === DataSource.Local) {
      void this.router.navigate(['/', PageRoute.Dashboard]);
      return;
    }
    void this.appService.authenticationReady.then(() => {
      if (this.appService.$currentUser())
        void this.router.navigate(['/', PageRoute.Dashboard]);
    });
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.$form().invalid()) return;
    this.$loading.set(true);
    try {
      await this.appService.signIn(
        this.$credentials().username,
        this.$credentials().password,
      );
      await this.router.navigate(['/', PageRoute.Dashboard]);
    } catch {
      // The service exposes a safe user-facing authentication error.
    } finally {
      this.$loading.set(false);
      this.$credentials.update((value) => ({ ...value, password: '' }));
    }
  }

  protected selectLoginAccount(username: string): void {
    this.$credentials.update((credentials) => ({ ...credentials, username }));
  }
}

// #endregion
