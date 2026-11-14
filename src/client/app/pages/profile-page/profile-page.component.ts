// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideLogOut } from '@lucide/angular';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { PageRoute } from 'src/client/app/app.info';
import {
  UserColor,
  UserRole,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { form, maxLength, minLength, required } from '@angular/forms/signals';
import { AccountFieldsComponent } from '../../components/forms/account-fields/account-fields.component';
import { UserIdentityComponent } from '../../components/user-identity/user-identity.component';
import { DataSource } from '../../shared/data-source.enum';
import {
  USER_COLOR_INFO,
  USER_COLOR_OPTIONS,
} from '../../shared/user-color-info';
import { UserColorPipe } from '../../shared/user-color.pipe';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    PageLayoutComponent,
    LucideLogOut,
    UserColorPipe,
    AccountFieldsComponent,
    UserIdentityComponent,
  ],
})
export class ProfilePageComponent {
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  protected readonly $currentUser = this.appService.$currentUser;
  protected readonly UserRole = UserRole;
  protected readonly USER_COLOR_INFO = USER_COLOR_INFO;
  protected readonly $userColorOptions = USER_COLOR_OPTIONS;
  protected readonly DataSource = DataSource;
  protected readonly $dataSource = this.appService.$dataSource;
  protected readonly $profileFields = linkedSignal(() => ({
    name: this.appService.$currentUser()?.name ?? '',
    username: this.appService.$currentUser()?.username ?? '',
    password: '',
    color: this.appService.$currentUser()?.color ?? UserColor.Blue,
  }));
  protected readonly $selectedColor = computed(
    () => this.$profileFields().color,
  );
  protected readonly $profileDisplayName = computed(() => {
    const fields = this.$profileFields();
    return (
      fields.name.trim() || fields.username || this.$currentUser()?.name || ''
    );
  });
  protected readonly $form = form(this.$profileFields, (path) => {
    maxLength(path.name, 100);
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
    required(path.color);
  });
  protected readonly $saved = signal(false);
  protected readonly $error = signal<string | undefined>(undefined);

  protected async saveProfile(): Promise<void> {
    if (this.$form().invalid()) return;
    const name = this.$profileFields().name.trim();
    const username = this.$profileFields().username.trim();
    if (!username) return;
    try {
      await this.appService.updateProfile(
        name,
        username,
        this.$profileFields().password,
        this.$profileFields().color,
      );
      this.$profileFields.update((value) => ({ ...value, password: '' }));
      this.$saved.set(true);
      this.$error.set(undefined);
    } catch (error: unknown) {
      this.$error.set(
        error instanceof Error ? error.message : 'Unable to update profile.',
      );
    }
  }

  protected selectColor(color: UserColor): void {
    this.$profileFields.update((value) => ({ ...value, color }));
    this.$saved.set(false);
  }

  protected signOut(): void {
    this.appService.signOut();
    void this.router.navigate(['/', PageRoute.Login]);
  }
}
// #endregion
