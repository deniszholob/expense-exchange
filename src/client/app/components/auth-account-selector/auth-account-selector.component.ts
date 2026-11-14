import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  UserRole,
  type LoginAccountDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
import { UserColorPipe } from 'src/client/app/shared/user-color.pipe';

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-account-selector',
  templateUrl: './auth-account-selector.component.html',
  host: { class: 'contents' },
  imports: [UserColorPipe],
})
export class AuthAccountSelectorComponent {
  protected readonly UserRole = UserRole;
  public readonly $accounts = input.required<LoginAccountDto[]>();
  public readonly $selectedUsername = input.required<string>();
  public readonly selected = output<string>();

  protected select(username: string): void {
    this.selected.emit(username);
  }
}
// #endregion
