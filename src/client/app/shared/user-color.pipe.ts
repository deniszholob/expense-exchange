// #region Imports
import { Pipe, PipeTransform } from '@angular/core';
import { UserColor } from 'src/client/api/generated/expense-exchange-api.schemas';
import { USER_COLOR_INFO } from './user-color-info';
// #endregion

// #region Pipe
@Pipe({ name: 'userColor' })
export class UserColorPipe implements PipeTransform {
  public transform(color: UserColor | undefined): string {
    return USER_COLOR_INFO[color ?? UserColor.Blue].value;
  }
}
// #endregion
