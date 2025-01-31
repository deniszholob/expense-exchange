import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PAGE_ROUTES } from './app.info';
import { APP_MODIFIED_DATE } from './app.modified';
import { AppService } from './shared/app/app.service';
import { toWordCase } from './utils';

interface Link {
  id: string;
  displayAs: string;
  note?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, RouterModule],
})
export class AppComponent {
  protected readonly APP_MODIFIED_DATE: number = APP_MODIFIED_DATE;

  protected readonly LINKS: Link[] = Object.values(PAGE_ROUTES).map((route) => {
    const link: Link = {
      id: route,
      displayAs: toWordCase(route.replace('_', ' ')),
    };
    if (route === PAGE_ROUTES.DEV_PAGE_ROOT) {
      link.note = 'only on local';
    }
    return link;
  });

  constructor(private appService: AppService) {}
}
