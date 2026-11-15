// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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
import {
  LucidePencil,
  LucideTrash2,
  LucideUserRoundPlus,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import {
  UserRole,
  UserColor,
  type AuthUserDto,
  type GroupMemberDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { AuthService } from 'src/client/api/generated/auth/auth.service';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { PageLayoutComponent } from 'src/client/app/layout';
import {
  FormFieldComponent,
  FormFieldIcon,
} from '../../components/forms/form-field/form-field.component';
import { AccountFieldsComponent } from '../../components/forms/account-fields/account-fields.component';
import { getHttpErrorMessage } from '../../shared/http-error-message';
import { UserColorPipe } from '../../shared/user-color.pipe';
import { UserMonogramPipe } from '../../shared/user-monogram.pipe';
import { USER_COLOR_OPTIONS } from '../../shared/user-color-info';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-management-page',
  templateUrl: './user-management-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    PageLayoutComponent,
    FormField,
    FormFieldComponent,
    AccountFieldsComponent,
    LucidePencil,
    LucideTrash2,
    LucideUserRoundPlus,
    UserColorPipe,
    UserMonogramPipe,
  ],
})
export class UserManagementPageComponent {
  protected readonly FormFieldIcon = FormFieldIcon;
  private readonly authApi = inject(AuthService);
  protected readonly appService = inject(AppService);
  protected readonly DataSource = DataSource;
  protected readonly UserRole = UserRole;
  protected readonly $userColorOptions = USER_COLOR_OPTIONS;
  protected readonly $accounts = signal<AuthUserDto[]>([]);
  protected readonly $localUsers = this.appService.$availableLocalUsers;
  protected readonly $localUserData = signal<{
    name: string;
    color: UserColor | '';
  }>({ name: '', color: '' });
  protected readonly $localUserForm = form(this.$localUserData, (path) =>
    required(path.name),
  );
  protected readonly $editingLocalId = signal<string | undefined>(undefined);
  protected readonly $accountData = signal({
    name: '',
    username: '',
    password: '',
  });
  protected readonly $form = form(this.$accountData, (path) => {
    maxLength(path.name, 100);
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
    required(path.password);
    minLength(path.password, 10);
    maxLength(path.password, 200);
  });
  protected readonly $accountFormError = signal<string | undefined>(undefined);
  protected readonly $accountSaving = signal(false);
  protected readonly $error = signal<string | undefined>(undefined);
  protected readonly $editingId = signal<string | undefined>(undefined);
  protected readonly $editData = signal({
    name: '',
    username: '',
    password: '',
  });
  protected readonly $editForm = form(this.$editData, (path) => {
    maxLength(path.name, 100);
    required(path.username);
    minLength(path.username, 3);
    maxLength(path.username, 64);
    minLength(path.password, 10);
    maxLength(path.password, 200);
  });

  public constructor() {
    void this.loadAccounts();
  }

  protected async addAccount(event: Event): Promise<void> {
    event.preventDefault();
    this.$accountFormError.set(undefined);
    if (this.$form().invalid()) {
      this.$accountFormError.set(
        'Enter a username (3–64 characters) and an initial password (10–200 characters).',
      );
      return;
    }
    const input = this.$accountData();
    this.$accountSaving.set(true);
    try {
      await firstValueFrom(
        this.authApi.authControllerCreateAccount({
          username: input.username.trim(),
          password: input.password,
          ...(input.name.trim() ? { name: input.name.trim() } : {}),
        }),
      );
      this.$accountData.set({ name: '', username: '', password: '' });
      this.$error.set(undefined);
      await this.loadAccounts();
    } catch (error: unknown) {
      this.$accountFormError.set(
        getHttpErrorMessage(error, 'Unable to add account.'),
      );
    } finally {
      this.$accountSaving.set(false);
    }
  }

  protected addLocalUser(event: Event): void {
    event.preventDefault();
    if (this.$localUserForm().invalid()) return;
    const name = this.$localUserData().name.trim();
    if (!name) return;
    const color = this.$localUserData().color;
    this.appService.upsertLocalAvailableUser({
      id: crypto.randomUUID(),
      name,
      ...(color ? { color } : {}),
    });
    this.$localUserData.set({ name: '', color: '' });
  }

  protected startEditingLocalUser(user: GroupMemberDto): void {
    this.$editingLocalId.set(user.id);
    this.$localUserData.set({ name: user.name, color: user.color ?? '' });
  }

  protected cancelLocalEditing(): void {
    this.$editingLocalId.set(undefined);
    this.$localUserData.set({ name: '', color: '' });
  }

  protected saveLocalUser(id: string, event: Event): void {
    event.preventDefault();
    if (this.$localUserForm().invalid()) return;
    const name = this.$localUserData().name.trim();
    if (!name) return;
    const color = this.$localUserData().color;
    this.appService.upsertLocalAvailableUser({
      id,
      name,
      ...(color ? { color } : {}),
    });
    this.$editingLocalId.set(undefined);
    this.$localUserData.set({ name: '', color: '' });
  }

  protected deleteLocalUser(id: string): void {
    const inGroup = this.appService
      .$groupMembers()
      .some((member) => member.id === id);
    const referenced = this.appService
      .exportLocalStore()
      .transactions.some(
        (transaction) =>
          transaction.targetParticipantId === id ||
          transaction.beneficiaryParticipantIds.includes(id),
      );
    if (inGroup || referenced) {
      this.$error.set(
        'Remove this person from the group and their expenses before deleting them.',
      );
      return;
    }
    this.appService.removeLocalAvailableUser(id);
    this.$error.set(undefined);
  }

  protected async deleteAccount(id: string): Promise<void> {
    try {
      await firstValueFrom(this.authApi.authControllerDeleteAccount(id));
      this.$error.set(undefined);
      await this.loadAccounts();
    } catch (error: unknown) {
      this.$error.set(getHttpErrorMessage(error, 'Unable to delete account.'));
    }
  }

  protected startEditing(account: AuthUserDto): void {
    this.$error.set(undefined);
    this.$editingId.set(account.id);
    this.$editData.set({
      name: account.name,
      username: account.username,
      password: '',
    });
  }

  protected cancelEditing(): void {
    this.$editingId.set(undefined);
    this.$editData.set({ name: '', username: '', password: '' });
  }

  protected async saveAccount(id: string, event: Event): Promise<void> {
    event.preventDefault();
    if (this.$editForm().invalid()) return;
    const data = this.$editData();
    try {
      await firstValueFrom(
        this.authApi.authControllerUpdateAccount(id, {
          name: data.name.trim(),
          username: data.username.trim(),
          ...(data.password ? { password: data.password } : {}),
        }),
      );
      this.cancelEditing();
      this.$error.set(undefined);
      await this.loadAccounts();
    } catch (error: unknown) {
      this.$error.set(getHttpErrorMessage(error, 'Unable to update account.'));
    }
  }

  private async loadAccounts(): Promise<void> {
    if (
      this.appService.$dataSource() !== DataSource.RemoteApi ||
      this.appService.$currentUser()?.role !== UserRole.Admin
    )
      return;
    try {
      this.$accounts.set(
        await firstValueFrom(this.authApi.authControllerListAccounts()),
      );
    } catch (error: unknown) {
      this.$error.set(getHttpErrorMessage(error, 'Unable to load accounts.'));
    }
  }
}
// #endregion
