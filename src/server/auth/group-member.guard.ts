import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';
import { UserRole } from '../../util/user-role.enum.js';

// #region Guard
@Injectable()
export class GroupMemberGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.authUser.role !== UserRole.User)
      throw new ForbiddenException(
        'Administrator accounts cannot access group or expense features',
      );
    return true;
  }
}
// #endregion
