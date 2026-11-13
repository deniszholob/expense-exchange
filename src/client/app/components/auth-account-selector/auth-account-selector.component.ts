import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import type { LoginAccountDto } from 'src/client/api/generated/expense-exchange-api.schemas';

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-account-selector',
  templateUrl: './auth-account-selector.component.html',
  host: { class: 'contents' },
})
export class AuthAccountSelectorComponent {
  public readonly $accounts = input.required<LoginAccountDto[]>();
  public readonly $selectedUsername = input.required<string>();
  public readonly selected = output<string>();

  protected select(username: string): void {
    this.selected.emit(username);
  }
}
// #endregion
