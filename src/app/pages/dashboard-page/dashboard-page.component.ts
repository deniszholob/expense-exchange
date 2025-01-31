import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageLayoutComponent } from 'src/app/layout';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  imports: [CommonModule, PageLayoutComponent],
  providers: [],
})
export class DashboardPageComponent {
  // constructor() {}
}
