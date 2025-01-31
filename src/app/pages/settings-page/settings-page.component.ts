import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from 'src/app/api';
import { FormFieldComponent } from 'src/app/components';
import { PageLayoutComponent } from 'src/app/layout';
import { AppService } from 'src/app/shared/app/app.service';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule, FormsModule, PageLayoutComponent, FormFieldComponent],
})
export class SettingsPageComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  constructor(protected appService: AppService) {}

  protected onChange(user: User): void {
    this.appService.currentUserChange.next(user);
  }
}
