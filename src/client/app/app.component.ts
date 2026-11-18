// #region Imports
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideBell, LucideX } from '@lucide/angular';

import { PageRoute } from './app.info';
import { RecurringStateService } from './shared/recurring-state.service';
import { FooterComponent, HeaderComponent } from './layout';
// #endregion

// #region Implementation

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  templateUrl: './app.component.html',
  host: { class: 'contents' },
  imports: [
    FooterComponent,
    HeaderComponent,
    RouterModule,
    LucideBell,
    LucideX,
  ],
})
export class AppComponent {
  protected readonly PageRoute = PageRoute;
  protected readonly recurringState = inject(RecurringStateService);
}

// #endregion
