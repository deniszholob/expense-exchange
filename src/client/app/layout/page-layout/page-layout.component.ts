// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-layout',
  templateUrl: './page-layout.component.html',
  host: {
    class: 'contents',
  },
})
export class PageLayoutComponent {
  public readonly $fillHeight = input(false);
}
// #endregion
