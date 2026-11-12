// #region Imports
import { Pipe, PipeTransform } from '@angular/core';
// #endregion

// #region Pipe
@Pipe({ name: 'userMonogram' })
export class UserMonogramPipe implements PipeTransform {
  public transform(name: string): string {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]);
    return initials.join('').toUpperCase() || '?';
  }
}
// #endregion
