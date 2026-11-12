// #region Imports
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import {
  AdminSetupDto,
  AuthResponseDto,
  AuthStatusDto,
  AuthUserDto,
  CredentialsDto,
  LogoutResponseDto,
  LoginAccountDto,
  ProfileUpdateDto,
  CreateAuthAccountDto,
  UpdateAuthAccountDto,
} from './auth.dto.js';
import { AuthGuard } from './auth.guard.js';
import { AdminGuard } from './admin.guard.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import { UserRole } from '../../util/user-role.enum.js';
// #endregion

// #region Controller
const CredentialsSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(10).max(200),
});
const SetupSchema = CredentialsSchema.extend({
  name: z.string().trim().max(100).optional(),
});
const CreateAccountSchema = CredentialsSchema.extend({
  name: z.string().trim().max(100).optional(),
});
const UpdateAccountSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    username: z.string().trim().min(3).max(64).optional(),
    password: z.string().max(200).optional(),
  })
  .refine(
    (value) =>
      value.password === undefined ||
      value.password.length === 0 ||
      value.password.length >= 10,
  );

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Check whether initial administrator setup is required',
  })
  @ApiOkResponse({ type: AuthStatusDto })
  public status(): Promise<AuthStatusDto> {
    return this.auth.status();
  }

  @Get('login-accounts')
  @ApiOperation({
    summary: 'List usernames and roles for the sign-in selector',
  })
  @ApiOkResponse({ type: LoginAccountDto, isArray: true })
  public listLoginAccounts(): Promise<LoginAccountDto[]> {
    return this.auth.listLoginAccounts();
  }

  @Get('accounts')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List accounts for group membership and administration',
  })
  @ApiOkResponse({ type: AuthUserDto, isArray: true })
  public async listAccounts(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthUserDto[]> {
    const accounts = await this.auth.listAccounts();
    return request.authUser.role === UserRole.Admin
      ? accounts
      : accounts.filter((account) => account.role !== UserRole.Admin);
  }

  @Post('accounts')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBody({ type: CreateAuthAccountDto })
  @ApiCreatedResponse({ type: AuthUserDto })
  public async createAccount(
    @Body() body: CreateAuthAccountDto,
  ): Promise<AuthUserDto> {
    const input = CreateAccountSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(
        'Provide a username and password of at least 10 characters',
      );
    return this.auth.createAccount(
      input.data.name,
      input.data.username,
      input.data.password,
    );
  }

  @Put('accounts/:id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiBody({ type: UpdateAuthAccountDto })
  @ApiOkResponse({ type: AuthUserDto })
  public async updateAccount(
    @Param('id') id: string,
    @Body() body: UpdateAuthAccountDto,
  ): Promise<AuthUserDto> {
    const input = UpdateAccountSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException('Invalid account updates');
    return this.auth.updateManagedAccount(id, input.data);
  }

  @Delete('accounts/:id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOkResponse({ type: AuthUserDto })
  public deleteAccount(@Param('id') id: string): Promise<AuthUserDto> {
    return this.auth.deleteManagedAccount(id);
  }

  @Post('setup')
  @ApiBody({ type: AdminSetupDto })
  @ApiOperation({ summary: 'Create the first administrator account' })
  @ApiOkResponse({ type: AuthResponseDto })
  public async setup(
    @Body() body: AdminSetupDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const input = SetupSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(
        'Provide a username and password of at least 10 characters',
      );
    const status = await this.auth.status();
    if (!status.setupRequired)
      return this.loginCredentials(
        input.data.username,
        input.data.password,
        response,
        request,
      );
    const user = await this.auth.setup(
      input.data.name,
      input.data.username,
      input.data.password,
    );
    const session = await this.auth.login(
      input.data.username,
      input.data.password,
    );
    setSessionCookie(response, session.token, request);
    return { user };
  }

  @Post('login')
  @ApiBody({ type: CredentialsDto })
  @ApiOperation({ summary: 'Sign in with username and password' })
  @ApiOkResponse({ type: AuthResponseDto })
  public async login(
    @Body() body: CredentialsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const input = CredentialsSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Invalid credentials');
    return this.loginCredentials(
      input.data.username,
      input.data.password,
      response,
      request,
    );
  }

  @Get('me')
  @ApiOkResponse({ type: AuthUserDto })
  public async me(@Req() request: Request): Promise<AuthUserDto> {
    return this.auth.authenticate(
      readCookie(request, 'expense_exchange_session'),
    );
  }

  @Post('logout')
  @ApiOkResponse({ type: LogoutResponseDto })
  public logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): LogoutResponseDto {
    response.clearCookie('expense_exchange_session', cookieOptions(request));
    return { success: true };
  }

  @Post('profile')
  @ApiBody({ type: ProfileUpdateDto })
  @ApiOperation({
    summary: 'Update the signed-in display name, username, or password',
  })
  @ApiOkResponse({ type: AuthUserDto })
  public async updateProfile(
    @Body() body: ProfileUpdateDto,
    @Req() request: Request,
  ): Promise<AuthUserDto> {
    const user = await this.auth.authenticate(
      readCookie(request, 'expense_exchange_session'),
    );
    const input = z
      .object({
        name: z.string().trim().max(100).optional(),
        username: z.string().trim().min(3).max(64),
        password: z.string().max(200).optional(),
      })
      .safeParse(body);
    if (
      !input.success ||
      (input.data.password !== undefined &&
        input.data.password.length > 0 &&
        input.data.password.length < 10)
    )
      throw new BadRequestException(
        'Username must be 3–64 characters and a new password must be at least 10 characters',
      );
    return this.auth.updateProfile(
      user.id,
      input.data.name,
      input.data.username,
      input.data.password ?? '',
    );
  }

  private async loginCredentials(
    username: string,
    password: string,
    response: Response,
    request: Request,
  ): Promise<AuthResponseDto> {
    const session = await this.auth.login(username, password);
    setSessionCookie(response, session.token, request);
    return { user: session.user };
  }
}
// #endregion

// #region Helpers
function setSessionCookie(
  response: Response,
  token: string,
  request: Request,
): void {
  response.cookie('expense_exchange_session', token, {
    ...cookieOptions(request),
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
}
function cookieOptions(request: Request): {
  httpOnly: true;
  sameSite: 'none' | 'lax';
  secure: boolean;
  path: string;
} {
  const origin = request.headers.origin;
  let crossSite = false;
  if (origin) {
    try {
      crossSite = new URL(origin).hostname !== request.hostname;
    } catch {
      crossSite = true;
    }
  }
  const secure = crossSite || request.secure;
  return {
    httpOnly: true,
    sameSite: crossSite ? 'none' : 'lax',
    secure,
    path: '/',
  };
}
function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}
// #endregion
