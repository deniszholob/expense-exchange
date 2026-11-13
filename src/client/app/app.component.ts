// #region Imports
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { APP_BUILD_DATE, APP_BUILD_VERSION } from './app.build';
import { HeaderComponent } from './layout';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  host: { class: 'contents' },
  imports: [CommonModule, HeaderComponent, RouterModule],
})
export class AppComponent {
  protected readonly APP_BUILD_DATE: number = APP_BUILD_DATE;
  protected readonly APP_BUILD_VERSION: string = APP_BUILD_VERSION;
}

// #endregion
