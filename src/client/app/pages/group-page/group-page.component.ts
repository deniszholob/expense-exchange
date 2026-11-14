// #region Imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import {
  LucideCheck,
  LucidePencil,
  LucideTrash2,
  LucideUsersRound,
  LucideX,
} from '@lucide/angular';
import { firstValueFrom } from 'rxjs';
import {
  UserRole,
  type AuthUserDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { AuthService } from 'src/client/api/generated/auth/auth.service';
import { GroupMembersService } from 'src/client/api/generated/group-members/group-members.service';
import { AppService } from 'src/client/app/app.service';
import { DataSource } from 'src/client/app/shared/data-source.enum';
import { PageLayoutComponent } from 'src/client/app/layout';
import { FormFieldComponent } from '../../components/forms/form-field/form-field.component';
import { UserMonogramPipe } from '../../shared/user-monogram.pipe';
// #endregion

// #region Types
interface GroupMemberViewModel {
  id: string;
  displayName: string;
  username?: string;
}

interface ExternalParticipantFormValue {
  name: string;
}
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-group-page',
  templateUrl: './group-page.component.html',
  host: { class: 'contents' },
  imports: [
    CommonModule,
    PageLayoutComponent,
    FormField,
    FormFieldComponent,
    LucideTrash2,
    LucidePencil,
    LucideCheck,
    LucideX,
    LucideUsersRound,
    UserMonogramPipe,
  ],
})
export class GroupPageComponent {
  protected readonly appService = inject(AppService);
  private readonly authApi = inject(AuthService);
  private readonly groupMembersApi = inject(GroupMembersService);
  protected readonly DataSource = DataSource;
  protected readonly $groupMembers = this.appService.$groupMembers;
  protected readonly $accounts = signal<AuthUserDto[]>([]);
  protected readonly $groupMemberRows = computed<GroupMemberViewModel[]>(() =>
    this.$groupMembers().map((member) => ({
      id: member.id,
      displayName: member.name || 'Unknown user',
      username: member.username,
    })),
  );
  private readonly $selection = signal({ accountId: '' });
  protected readonly $form = form(this.$selection, (path) =>
    required(path.accountId),
  );
  protected readonly $availableAccounts = computed(() => {
    if (!this.appService.$groupMembersReady()) return [];
    const memberIds = new Set(this.$groupMembers().map((member) => member.id));
    return this.$accounts().filter(
      (account) =>
        account.role !== UserRole.Admin && !memberIds.has(account.id),
    );
  });
  protected readonly $availableLocalUsers = computed(() => {
    const memberIds = new Set(this.$groupMembers().map((member) => member.id));
    return this.appService
      .$availableLocalUsers()
      .filter((user) => !memberIds.has(user.id));
  });
  protected readonly $error = signal<string | undefined>(undefined);
  protected readonly $externalParticipantData =
    signal<ExternalParticipantFormValue>({ name: '' });
  protected readonly $externalParticipantForm = form(
    this.$externalParticipantData,
    (path) => {
      required(path.name);
      minLength(path.name, 1);
    },
  );
  protected readonly $editingExternalParticipantId = signal<string | undefined>(
    undefined,
  );
  protected readonly $externalParticipants =
    this.appService.$externalParticipants;
  protected readonly $externalParticipantError = signal<string | undefined>(
    undefined,
  );

  public constructor() {
    void this.appService.authenticationReady.then(() => this.loadAccounts());
  }

  protected async addMember(event: Event): Promise<void> {
    event.preventDefault();
    if (this.appService.$dataSource() === DataSource.Local) {
      if (this.$form().invalid()) return;
      const user = this.$availableLocalUsers().find(
        (candidate) => candidate.id === this.$selection().accountId,
      );
      if (!user) return;
      this.appService.upsertLocalGroupMember(user);
      this.$selection.set({ accountId: '' });
      return;
    }
    if (this.$form().invalid()) return;
    const accountId = this.$selection().accountId;
    if (!accountId) return;
    try {
      await firstValueFrom(
        this.groupMembersApi.groupMembersControllerAddMember({ accountId }),
      );
      this.$selection.set({ accountId: '' });
      this.appService.refreshGroupMembers();
      await this.loadAccounts();
    } catch (error: unknown) {
      this.$error.set(
        error instanceof Error ? error.message : 'Unable to add group member.',
      );
    }
  }

  protected async removeMember(id: string): Promise<void> {
    try {
      if (this.appService.$dataSource() === DataSource.Local) {
        if (
          this.appService
            .exportLocalStore()
            .transactions.some(
              (transaction) =>
                transaction.targetParticipantId === id ||
                transaction.beneficiaryParticipantIds.includes(id),
            )
        ) {
          this.$error.set('This person is referenced by an expense.');
          return;
        }
        this.appService.removeLocalGroupMember(id);
      } else {
        await firstValueFrom(
          this.groupMembersApi.groupMembersControllerRemoveMember(id),
        );
        this.appService.refreshGroupMembers();
        await this.loadAccounts();
      }
    } catch (error: unknown) {
      this.$error.set(
        error instanceof Error
          ? error.message
          : 'Unable to remove group member.',
      );
    }
  }

  protected async saveExternalParticipant(event: Event): Promise<void> {
    event.preventDefault();
    if (this.$externalParticipantForm().invalid()) return;
    const { name } = this.$externalParticipantData();
    try {
      const editingId = this.$editingExternalParticipantId();
      if (editingId)
        await this.appService.updateExternalParticipant(editingId, name);
      else await this.appService.createExternalParticipant(name);
      this.$externalParticipantData.set({ name: '' });
      this.$editingExternalParticipantId.set(undefined);
      this.$externalParticipantError.set(undefined);
    } catch (error: unknown) {
      this.$externalParticipantError.set(
        error instanceof Error
          ? error.message
          : 'Unable to save external participant.',
      );
    }
  }

  protected editExternalParticipant(id: string, name: string): void {
    this.$editingExternalParticipantId.set(id);
    this.$externalParticipantData.set({ name });
    this.$externalParticipantError.set(undefined);
  }

  protected cancelExternalParticipantEdit(): void {
    this.$editingExternalParticipantId.set(undefined);
    this.$externalParticipantData.set({ name: '' });
  }

  protected async deleteExternalParticipant(id: string): Promise<void> {
    try {
      await this.appService.deleteExternalParticipant(id);
      this.$externalParticipantError.set(undefined);
    } catch (error: unknown) {
      this.$externalParticipantError.set(
        error instanceof Error
          ? error.message
          : 'Unable to delete external participant.',
      );
    }
  }

  private async loadAccounts(): Promise<void> {
    if (
      this.appService.$dataSource() !== DataSource.RemoteApi ||
      !this.appService.$currentUser()
    )
      return;
    try {
      this.$accounts.set(
        await firstValueFrom(this.authApi.authControllerListAccounts()),
      );
    } catch {
      this.$error.set('Unable to load available accounts.');
    }
  }
}
// #endregion
