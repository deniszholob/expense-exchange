import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageLayoutComponent } from 'src/app/layout';

@Component({
  selector: 'app-dev-page',
  templateUrl: './dev-page.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, PageLayoutComponent],
})
export class DevPageComponent {}
