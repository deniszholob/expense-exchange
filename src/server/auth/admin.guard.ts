// #region Imports
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';
import { UserRole } from '../../util/user-role.enum.js';
// #endregion

// #region Guard
@Injectable()
export class AdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.authUser.role !== UserRole.Admin)
      throw new ForbiddenException('Administrator access required');
    return true;
  }
}
// #endregion
