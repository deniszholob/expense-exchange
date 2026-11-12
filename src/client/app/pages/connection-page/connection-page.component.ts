// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { Router } from '@angular/router';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import {
  DATA_SOURCE_INFO_OPTIONS,
  DataSource,
} from 'src/client/app/shared/data-source.enum';
import {
  getDefaultRemoteApiUrl,
  getRemoteApiUrlHistory,
  saveConfiguredRemoteApiUrl,
} from 'src/client/app/shared/remote-api-config';
import { RemoteApiHealthProbeService } from 'src/client/app/shared/remote-api-health-probe.service';
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { PAGE_ROUTES } from '../../app.info';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-connection-page',
  templateUrl: './connection-page.component.html',
  imports: [CommonModule, PageLayoutComponent, FormField, FormFieldComponent],
})
export class ConnectionPageComponent {
  protected readonly appService = inject(AppService);
  protected readonly DataSource = DataSource;
  protected readonly DATA_SOURCE_INFO_OPTIONS = DATA_SOURCE_INFO_OPTIONS;
  protected readonly $message = signal<string | undefined>(undefined);
  protected readonly $draftDataSource = signal(this.appService.$dataSource());
  protected readonly $remoteApiUrl = signal(
    this.appService.dataSourcePath[DataSource.RemoteApi],
  );
  protected readonly $defaultRemoteApiUrl = getDefaultRemoteApiUrl();
  protected readonly $remoteApiUrlHistory = signal(
    getRemoteApiUrlHistory(
      this.appService.dataSourcePath[DataSource.RemoteApi],
    ),
  );
  protected readonly $selectionDirty = signal(false);
  protected readonly $draftApiHealth = signal<
    'idle' | 'checking' | 'healthy' | 'unavailable'
  >('idle');
  protected readonly $draftApiHealthError = signal<string | undefined>(
    undefined,
  );
  protected readonly $authStatusReady = this.appService.$authStatusReady;
  protected readonly $setupRequired = this.appService.$authSetupRequired;
  protected readonly $authError = this.appService.$authError;
  protected readonly $apiHealthy = this.appService.$apiHealthy;
  protected readonly $authLoading = signal(false);
  protected readonly $authFormError = signal<string | undefined>(undefined);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly healthProbe = inject(RemoteApiHealthProbeService);
  private remoteStatusCheckTimer: number | undefined;
  private remoteHealthCheckId = 0;
  protected readonly $authData = signal({
    name: '',
    username: '',
    password: '',
  });
  protected readonly $authForm = form(this.$authData, (path) => {
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
    required(path.password);
    minLength(path.password, 10);
    maxLength(path.password, 200);
    maxLength(path.name, 100);
  });

  protected selectSource(event: Event): void {
    this.clearRemoteStatusCheck();
    const value =
      event.target instanceof HTMLInputElement ? event.target.value : '';
    if (value === DataSource.Local || value === DataSource.RemoteApi) {
      this.$draftDataSource.set(value);
      this.$selectionDirty.set(true);
      this.$message.set(undefined);
      if (value === DataSource.RemoteApi)
        this.scheduleRemoteStatusCheck(this.$remoteApiUrl());
    }
  }

  protected updateApiUrl(event: Event): void {
    const url =
      event.target instanceof HTMLInputElement ? event.target.value : '';
    this.$remoteApiUrl.set(url);
    this.$selectionDirty.set(true);
    this.$message.set(undefined);
    if (this.$draftDataSource() !== DataSource.RemoteApi) return;
    this.scheduleRemoteStatusCheck(url);
  }

  protected checkRemoteApiAgain(): void {
    this.clearRemoteStatusCheck();
    this.persistRemoteApiUrl();
    void this.appService.connectToRemoteApi();
  }

  protected selectRecentApiUrl(url: string): void {
    this.$remoteApiUrl.set(url);
    this.$selectionDirty.set(true);
    this.$message.set(undefined);
    this.scheduleRemoteStatusCheck(url);
  }

  private scheduleRemoteStatusCheck(url: string): void {
    this.clearRemoteStatusCheck();
    const checkId = ++this.remoteHealthCheckId;
    this.$draftApiHealth.set('checking');
    this.$draftApiHealthError.set(undefined);
    this.remoteStatusCheckTimer = window.setTimeout(() => {
      this.remoteStatusCheckTimer = undefined;
      void this.healthProbe
        .check(url)
        .then(() => {
          if (checkId === this.remoteHealthCheckId)
            this.$draftApiHealth.set('healthy');
        })
        .catch((error: unknown) => {
          if (checkId !== this.remoteHealthCheckId) return;
          this.$draftApiHealth.set('unavailable');
          this.$draftApiHealthError.set(
            error instanceof Error
              ? error.message
              : 'Unable to reach the selected API.',
          );
        });
    }, 500);
  }

  protected async saveSelection(): Promise<void> {
    this.clearRemoteStatusCheck();
    const dataSource = this.$draftDataSource();
    this.appService.selectDataSource(dataSource);
    this.$selectionDirty.set(false);
    if (dataSource === DataSource.RemoteApi) {
      this.persistRemoteApiUrl();
      await this.appService.connectToRemoteApi();
      this.$draftApiHealth.set(
        this.appService.$apiHealthy() ? 'healthy' : 'unavailable',
      );
      this.$draftApiHealthError.set(this.appService.$authError());
      this.$message.set(
        this.appService.$authError() ?? 'Remote API selection saved.',
      );
      if (!this.$setupRequired()) {
        const destination = this.appService.$currentUser()
          ? PAGE_ROUTES.DASHBOARD_PAGE_ROOT
          : PAGE_ROUTES.LOGIN_PAGE_ROOT;
        await this.router.navigate(['/', destination]);
      }
      return;
    }
    this.$draftApiHealth.set('idle');
    this.$message.set('Local data source selected for this browser.');
    await this.router.navigate(['/', PAGE_ROUTES.DASHBOARD_PAGE_ROOT]);
  }

  public constructor() {
    this.destroyRef.onDestroy(() => this.clearRemoteStatusCheck());
  }

  private clearRemoteStatusCheck(): void {
    this.remoteHealthCheckId++;
    if (this.remoteStatusCheckTimer !== undefined) {
      window.clearTimeout(this.remoteStatusCheckTimer);
      this.remoteStatusCheckTimer = undefined;
    }
  }

  private persistRemoteApiUrl(): void {
    const url = this.$remoteApiUrl().trim();
    this.appService.dataSourcePath[DataSource.RemoteApi] = url;
    saveConfiguredRemoteApiUrl(url);
    this.$remoteApiUrlHistory.set(getRemoteApiUrlHistory());
  }

  protected async submitAdminSetup(event: Event): Promise<void> {
    event.preventDefault();
    this.$authFormError.set(undefined);
    if (this.$authForm().invalid()) {
      this.$authFormError.set(
        'Enter a username (3–64 characters) and a password (10–200 characters).',
      );
      return;
    }
    this.$authLoading.set(true);
    try {
      const data = this.$authData();
      await this.appService.setupAdmin(
        data.name.trim() || data.username.trim(),
        data.username,
        data.password,
      );
    } catch (error: unknown) {
      this.$authFormError.set(
        this.appService.$authError() ??
          (error instanceof Error
            ? error.message
            : 'Unable to create the administrator account.'),
      );
    } finally {
      this.$authLoading.set(false);
      this.$authData.update((data) => ({ ...data, password: '' }));
    }
    if (!this.$authFormError())
      await this.router.navigate(['/', PAGE_ROUTES.DASHBOARD_PAGE_ROOT]);
  }

  protected async importFile(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
    if (
      !window.confirm(
        'Loading this file replaces the current local data. Continue?',
      )
    ) {
      input.value = '';
      return;
    }
    try {
      const content: unknown = JSON.parse(await input.files[0].text());
      if (!this.appService.loadLocalStore(content))
        throw new Error(
          'The selected file is not a valid Expense Exchange data file.',
        );
      this.$message.set('Local data file loaded.');
    } catch (error: unknown) {
      this.$message.set(
        error instanceof Error ? error.message : 'Unable to load this file.',
      );
    } finally {
      input.value = '';
    }
  }

  protected exportFile(): void {
    const serialized = JSON.stringify(
      this.appService.exportLocalStore(),
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([serialized], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'expense-exchange-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  protected clearLocalData(): void {
    if (
      !window.confirm(
        'Clear all local users, group members, and expenses? This cannot be undone.',
      )
    )
      return;
    this.appService.clearLocalStore();
    this.$message.set('Local data cleared.');
  }
}
// #endregion
