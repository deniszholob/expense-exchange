// #region Imports
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { SESSION_COOKIE_NAME } from '../auth/auth-session.constants.js';
import type { AuthUser } from '../auth/auth.schema.js';
// #endregion

// #region Guard
export interface AuthenticatedRequest extends Request {
  authUser: AuthUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(private readonly auth: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request, SESSION_COOKIE_NAME);
    request.authUser = await this.auth.authenticate(token);
    return true;
  }
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  const part = header
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return part?.slice(name.length + 1);
}
// #endregion
