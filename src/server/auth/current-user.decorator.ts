// #region Imports
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';
import type { AuthUser } from './auth.schema.js';
// #endregion

// #region Current User Decorator
/** Reads the authenticated user populated by `AuthGuard` from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authUser;
  },
);
// #endregion
