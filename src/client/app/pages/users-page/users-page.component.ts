// #region Imports
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UsersService } from 'src/client/api/generated/users/users.service';
import { AppService } from 'src/client/app/app.service';
import { PageLayoutComponent } from 'src/client/app/layout';
// #endregion

// #region Component
@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  imports: [CommonModule, PageLayoutComponent],
})
export class UsersPageComponent {
  private readonly appService = inject(AppService);
  private readonly usersService = inject(UsersService);

  protected readonly $users = this.appService.$users;
  protected readonly $newUserName = signal('');
  protected readonly $editingUserId = signal<string | undefined>(undefined);
  protected readonly $editingUserName = signal('');
  protected readonly $error = signal<string | undefined>(undefined);

  public onNewUserNameInput(event: Event): void {
    this.$newUserName.set(readInputValue(event));
  }

  public onEditingUserNameInput(event: Event): void {
    this.$editingUserName.set(readInputValue(event));
  }

  public startEditing(id: string, name: string): void {
    this.$error.set(undefined);
    this.$editingUserId.set(id);
    this.$editingUserName.set(name);
  }

  public cancelEditing(): void {
    this.$editingUserId.set(undefined);
    this.$editingUserName.set('');
  }

  public async createUser(): Promise<void> {
    const name = this.$newUserName().trim();
    if (!name) return;
    try {
      await firstValueFrom(
        this.usersService.userControllerCreateUser({ name }),
      );
      this.$newUserName.set('');
      this.$error.set(undefined);
      this.appService.refreshUsers();
    } catch (error: unknown) {
      this.setError(error);
    }
  }

  public async saveUser(): Promise<void> {
    const id = this.$editingUserId();
    const name = this.$editingUserName().trim();
    if (!id || !name) return;
    try {
      await firstValueFrom(
        this.usersService.userControllerUpdateUser(id, { name }),
      );
      this.cancelEditing();
      this.$error.set(undefined);
      this.appService.refreshUsers();
    } catch (error: unknown) {
      this.setError(error);
    }
  }

  public async deleteUser(id: string): Promise<void> {
    try {
      await firstValueFrom(this.usersService.userControllerDeleteUser(id));
      this.$error.set(undefined);
      this.appService.refreshUsers();
    } catch (error: unknown) {
      this.setError(error);
    }
  }

  private setError(error: unknown): void {
    this.$error.set(
      error instanceof Error ? error.message : 'Unable to save user.',
    );
  }
}
// #endregion

// #region Helpers
function readInputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : '';
}
// #endregion
