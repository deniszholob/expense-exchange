// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UserColorPipe } from 'src/client/app/shared/user-color.pipe';
import { UserMonogramPipe } from 'src/client/app/shared/user-monogram.pipe';
import type { UserColor } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-identity',
  templateUrl: './user-identity.component.html',
  host: { class: 'contents' },
  imports: [UserColorPipe, UserMonogramPipe],
})
export class UserIdentityComponent {
  public readonly $displayName = input.required<string>();
  public readonly $username = input<string>();
  public readonly $color = input<UserColor>();
  public readonly $isAdmin = input(false);
}
// #endregion
