import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { User } from 'src/app/api';
import { AppService } from 'src/app/shared/app/app.service';

@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [CommonModule],
})
export class UsersPageComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits

  protected users: User[] = this.appService._users;

  constructor(private appService: AppService) {}
}
