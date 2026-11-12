// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideLogOut } from '@lucide/angular';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import { PAGE_ROUTES } from 'src/client/app/app.info';
import { UserRole } from '../../../../util/user-role.enum';
import { UserMonogramPipe } from '../../shared/user-monogram.pipe';
import {
  FormField,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { DataSource } from '../../shared/data-source.enum';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  imports: [
    CommonModule,
    PageLayoutComponent,
    LucideLogOut,
    UserMonogramPipe,
    FormField,
    FormFieldComponent,
  ],
})
export class ProfilePageComponent {
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);
  protected readonly $currentUser = this.appService.$currentUser;
  protected readonly UserRole = UserRole;
  protected readonly DataSource = DataSource;
  protected readonly $dataSource = this.appService.$dataSource;
  private readonly $profileFields = linkedSignal(() => ({
    username: this.appService.$currentUser()?.username ?? '',
    password: '',
  }));
  protected readonly $form = form(this.$profileFields, (path) => {
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
  });
  protected readonly $saved = signal(false);
  protected readonly $error = signal<string | undefined>(undefined);

  protected async saveProfile(): Promise<void> {
    if (this.$form().invalid()) return;
    const username = this.$profileFields().username.trim();
    if (!username) return;
    try {
      await this.appService.updateProfile(
        username,
        this.$profileFields().password,
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

  protected signOut(): void {
    this.appService.signOut();
    void this.router.navigate(['/', PAGE_ROUTES.LOGIN_PAGE_ROOT]);
  }
}
// #endregion
