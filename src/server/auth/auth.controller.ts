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
import type { ZodError } from 'zod';
import { AuthService } from './auth.service.js';
import {
  AdminSetupSchema,
  AUTH_NAME_MAX_LENGTH,
  CreateAuthAccountSchema,
  LoginCredentialsSchema,
  PASSWORD_POLICY,
  USERNAME_LENGTH,
  UpdateAuthAccountSchema,
  UpdateProfileSchema,
} from './auth.schema.js';
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
import { AuthGuard } from '../guards/auth.guard.js';
import { AdminGuard } from '../guards/admin.guard.js';
import type { AuthenticatedRequest } from '../guards/auth.guard.js';
import { UserRole } from './user-role.enum.js';
// #endregion

// #region Controller
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
    const input = CreateAuthAccountSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(authInputMessage(input.error));
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
    const input = UpdateAuthAccountSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(authInputMessage(input.error));
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
    const input = AdminSetupSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(authInputMessage(input.error));
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
    const input = LoginCredentialsSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(authInputMessage(input.error));
    return this.loginCredentials(
      input.data.username,
      input.data.password,
      response,
      request,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: AuthUserDto })
  public me(@Req() request: AuthenticatedRequest): AuthUserDto {
    return request.authUser;
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
  @UseGuards(AuthGuard)
  @ApiBody({ type: ProfileUpdateDto })
  @ApiOperation({
    summary: 'Update the signed-in profile name, username, password, or color',
  })
  @ApiOkResponse({ type: AuthUserDto })
  public async updateProfile(
    @Body() body: ProfileUpdateDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthUserDto> {
    const input = UpdateProfileSchema.safeParse(body);
    if (!input.success)
      throw new BadRequestException(authInputMessage(input.error));
    return this.auth.updateProfile(
      request.authUser.id,
      input.data.name,
      input.data.username,
      input.data.password ?? '',
      input.data.color,
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
function authInputMessage(error: ZodError): string {
  const field = error.issues.find((issue) => issue.path.length > 0)?.path[0];
  if (field === 'username')
    return `Username must be between ${USERNAME_LENGTH.min} and ${USERNAME_LENGTH.max} characters.`;
  if (field === 'password')
    return `Password must be between ${PASSWORD_POLICY.minLength} and ${PASSWORD_POLICY.maxLength} characters.`;
  if (field === 'name')
    return `Name must be at most ${AUTH_NAME_MAX_LENGTH} characters.`;
  return 'Invalid authentication details.';
}

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
// #endregion
