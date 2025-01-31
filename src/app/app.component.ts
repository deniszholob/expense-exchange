import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { APP_MODIFIED_DATE } from './app.modified';
import { HeaderComponent } from './layout';
import { AppService } from './shared/app/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, HeaderComponent, RouterModule],
})
export class AppComponent {
  protected readonly APP_MODIFIED_DATE: number = APP_MODIFIED_DATE;

  constructor(private appService: AppService) {}
}
