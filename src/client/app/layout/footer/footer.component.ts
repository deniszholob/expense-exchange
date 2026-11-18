// #region Imports
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { APP_BUILD_DATE, APP_BUILD_VERSION } from '../../app.build';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  host: { class: 'contents' },
  imports: [CommonModule],
})
export class FooterComponent {
  protected readonly APP_BUILD_DATE: number = APP_BUILD_DATE;
  protected readonly APP_BUILD_VERSION: string = APP_BUILD_VERSION;
}

// #endregion
