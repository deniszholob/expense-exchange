// #region Imports
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideBell, LucideX } from '@lucide/angular';

import { APP_BUILD_DATE, APP_BUILD_VERSION } from './app.build';
import { PageRoute } from './app.info';
import { RecurringStateService } from './shared/recurring-state.service';
import { HeaderComponent } from './layout';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  host: { class: 'contents' },
  imports: [CommonModule, HeaderComponent, RouterModule, LucideBell, LucideX],
})
export class AppComponent {
  protected readonly APP_BUILD_DATE: number = APP_BUILD_DATE;
  protected readonly APP_BUILD_VERSION: string = APP_BUILD_VERSION;
  protected readonly PageRoute = PageRoute;
  protected readonly recurringState = inject(RecurringStateService);
}

// #endregion
