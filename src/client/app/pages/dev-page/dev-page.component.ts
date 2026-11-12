import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageLayoutComponent } from 'src/client/app/layout';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dev-page',
  templateUrl: './dev-page.component.html',
  styles: [':host{display:contents}'],
  imports: [CommonModule, PageLayoutComponent],
})
export class DevPageComponent {}
