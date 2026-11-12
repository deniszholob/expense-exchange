// #region Imports
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { APP_BUILD_DATE, APP_BUILD_VERSION } from './app.build';
import { HeaderComponent } from './layout';
import { AppService } from './app.service';
// #endregion

// #region Implementation

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, HeaderComponent, RouterModule],
})
export class AppComponent {
  protected readonly APP_BUILD_DATE: number = APP_BUILD_DATE;
  protected readonly APP_BUILD_VERSION: string = APP_BUILD_VERSION;

  public constructor(private appService: AppService) {}
}

// #endregion
