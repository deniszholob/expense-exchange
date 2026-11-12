// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-layout',
  templateUrl: './page-layout.component.html',
  host: { class: 'block' },
})
export class PageLayoutComponent {}
// #endregion
