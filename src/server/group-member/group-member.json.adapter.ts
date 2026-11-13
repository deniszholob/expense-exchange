// #region Imports
import { join } from 'node:path';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberStoreSchema } from './group-member.schema.js';
import type {
  GroupMemberDto,
  GroupMemberProfileDto,
} from './group-member.dto.js';
import { GroupMemberRepository } from './group-member.repository.js';
import { JsonStore } from '../utils/json-store.js';
// #endregion

// #region JSON Adapter
@Injectable()
export class GroupMemberJsonAdapter extends GroupMemberRepository {
  private readonly store = new JsonStore(
    join(process.env['DATA_DIR'] ?? '.dist/data', 'group-members.json'),
    GroupMemberStoreSchema,
    () => ({ version: 1, users: [] }),
  );

  public async getGroupMembers(): Promise<GroupMemberDto[]> {
    return (await this.store.read()).users;
  }

  public async createGroupMember(
    input: GroupMemberProfileDto,
    id: string,
  ): Promise<GroupMemberDto> {
    return this.store.update((store) => {
      if (store.users.some((member) => member.id === id))
        throw new ConflictException('Group member already exists');
      const member: GroupMemberDto = { ...input, id };
      store.users.push(member);
      return member;
    });
  }

  public async deleteGroupMember(id: string): Promise<GroupMemberDto> {
    return this.store.update((store) => {
      const index = store.users.findIndex((member) => member.id === id);
      if (index < 0) throw new NotFoundException('Group member not found');
      return store.users.splice(index, 1)[0]!;
    });
  }
}
// #endregion
