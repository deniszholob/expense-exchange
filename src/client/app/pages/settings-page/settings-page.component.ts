// #region Imports
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserDto } from 'src/client/api/generated/expense-exchange-api.schemas';
import { FormFieldComponent } from 'src/client/app/components';
import { PageLayoutComponent } from 'src/client/app/layout';
import { AppService } from 'src/client/app/app.service';
import {
  DATA_SOURCE_INFO_OPTIONS,
  DataSource,
} from 'src/client/app/shared/data-source.enum';
// #endregion

// #region Implementation

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule, FormsModule, PageLayoutComponent, FormFieldComponent],
})
export class SettingsPageComponent {
  protected readonly DataSource = DataSource;
  protected readonly DATA_SOURCE_INFO_OPTIONS = DATA_SOURCE_INFO_OPTIONS;
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  public constructor(protected appService: AppService) {}

  protected onChange(user: UserDto): void {
    this.appService.switchUser(user);
  }
}

// #endregion
