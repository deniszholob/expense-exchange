// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, required } from '@angular/forms/signals';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { PageRoute } from 'src/client/app/app.info';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { getHttpErrorMessage } from 'src/client/app/shared/http-error-message';
import {
  FormFieldComponent,
  FormFieldIcon,
} from '../../components/forms/form-field/form-field.component';
import { AuthAccountSelectorComponent } from '../../components/auth-account-selector/auth-account-selector.component';
// #endregion

// #region Recovery State
enum PasswordRecoveryMethod {
  AdminAssisted = 'AdminAssisted',
  ServerFilesystem = 'ServerFilesystem',
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
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
    required(path.password);
  });
  protected readonly $loading = signal(false);
  protected readonly $error = this.appService.$authError;
  protected readonly $authStatusReady = this.appService.$authStatusReady;
  protected readonly $localMode = this.appService.$dataSource;
  protected readonly DataSource = DataSource;
  protected readonly PasswordRecoveryMethod = PasswordRecoveryMethod;
  protected readonly $recoveryOpen = signal(false);
  protected readonly $recoveryMethod = signal<
    PasswordRecoveryMethod | undefined
  >(undefined);
  protected readonly $recoveryRequest = signal({ username: '' });
  protected readonly $recoveryRequestForm = form(
    this.$recoveryRequest,
    (path) => required(path.username),
  );
  protected readonly $recoveryCompletion = signal({
    username: '',
    code: '',
    password: '',
  });
  protected readonly $recoveryCompletionForm = form(
    this.$recoveryCompletion,
    (path) => {
      required(path.username);
      required(path.code);
      required(path.password);
    },
  );
  protected readonly $recoveryRequested = signal(false);
  protected readonly $recoveryCompleted = signal(false);
  protected readonly $recoveryLoading = signal(false);
  protected readonly $recoveryError = signal<string | undefined>(undefined);

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

  protected openRecovery(): void {
    this.$recoveryRequest.set({ username: this.$credentials().username });
    this.$recoveryCompletion.set({
      username: this.$credentials().username,
      code: '',
      password: '',
    });
    this.$recoveryOpen.set(true);
    this.$recoveryMethod.set(undefined);
    this.$recoveryRequested.set(false);
    this.$recoveryCompleted.set(false);
    this.$recoveryError.set(undefined);
  }

  protected closeRecovery(): void {
    this.$recoveryOpen.set(false);
    this.$recoveryMethod.set(undefined);
    this.$recoveryError.set(undefined);
  }

  protected selectRecoveryMethod(method: PasswordRecoveryMethod): void {
    if (this.$recoveryMethod() !== method) {
      this.$recoveryRequested.set(false);
      this.$recoveryCompleted.set(false);
      this.$recoveryCompletion.update((value) => ({
        ...value,
        code: '',
        password: '',
      }));
    }
    this.$recoveryMethod.set(method);
    this.$recoveryError.set(undefined);
  }

  protected showRecoveryMethods(): void {
    this.$recoveryMethod.set(undefined);
    this.$recoveryError.set(undefined);
  }

  protected async requestFilesystemRecovery(event: Event): Promise<void> {
    event.preventDefault();
    if (this.$recoveryRequestForm().invalid()) return;
    this.$recoveryLoading.set(true);
    this.$recoveryError.set(undefined);
    const username = this.$recoveryRequest().username.trim();
    try {
      await this.appService.requestFilesystemPasswordReset(username);
      this.$recoveryCompletion.update((value) => ({ ...value, username }));
      this.$recoveryRequested.set(true);
    } catch (error: unknown) {
      this.$recoveryError.set(
        getHttpErrorMessage(error, 'Unable to create the recovery request.'),
      );
    } finally {
      this.$recoveryLoading.set(false);
    }
  }

  protected async completeFilesystemRecovery(event: Event): Promise<void> {
    event.preventDefault();
    if (this.$recoveryCompletionForm().invalid()) return;
    this.$recoveryLoading.set(true);
    this.$recoveryError.set(undefined);
    const recovery = this.$recoveryCompletion();
    try {
      await this.appService.completeFilesystemPasswordReset(
        recovery.username.trim(),
        recovery.code.trim(),
        recovery.password,
      );
      this.$credentials.set({
        username: recovery.username.trim(),
        password: '',
      });
      this.$recoveryCompleted.set(true);
      this.$recoveryCompletion.update((value) => ({
        ...value,
        code: '',
        password: '',
      }));
    } catch (error: unknown) {
      this.$recoveryError.set(
        getHttpErrorMessage(error, 'The recovery code is invalid or expired.'),
      );
    } finally {
      this.$recoveryLoading.set(false);
    }
  }
}

// #endregion
