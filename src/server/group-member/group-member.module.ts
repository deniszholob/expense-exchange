// #region Imports
import { Module } from '@nestjs/common';

import { ServicesModule } from '../services/services.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence.module.js';
import { GroupMembersController } from './group-member.controller.js';
import { GroupMemberService } from './group-member.service.js';
// #endregion

// #region Module
@Module({
  imports: [PersistenceModule, AuthModule, ServicesModule],
  controllers: [GroupMembersController],
  providers: [GroupMemberService],
})
export class GroupMemberModule {}
// #endregion
