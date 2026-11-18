// #region Imports
import { Module } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';

import { PersistenceModule } from '../persistence.module.js';
import { AdminGuard } from '../guards/admin.guard.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { GroupMemberGuard } from '../guards/group-member.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule],
  controllers: [AuthController],
  providers: [
    {
      provide: PasswordHasher,
      useFactory: (): PasswordHasher => new PasswordHasher(),
    },
    AuthService,
    AuthGuard,
    AdminGuard,
    GroupMemberGuard,
  ],
  exports: [AuthService, AuthGuard, GroupMemberGuard],
})
export class AuthModule {}
// #endregion
