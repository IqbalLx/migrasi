import { z } from 'zod';
import {
  KyselyTableDefault,
  PaginationMeta,
  TableDefault,
  omitTimestamp,
  wrapInPagination,
} from './common';
import { User, UserDPO, UserMapper } from './user.entity';

const ProjectMemberEntity = z.object({
  project_id: z.string().uuid(),
  member_id: z.string().uuid(),
});
export const ProjectMember = ProjectMemberEntity.merge(TableDefault);
export const ProjectMemberDPO = omitTimestamp(UserDPO);
export const PaginatedProjectMemberDPO = wrapInPagination(ProjectMemberDPO);

export type ProjectMember = z.infer<typeof ProjectMember>;
export type ProjectMemberDPO = z.infer<typeof ProjectMemberDPO>;
export type PaginatedProjectMemberDPO = z.infer<
  typeof PaginatedProjectMemberDPO
>;

export type ProjectMemberTable = KyselyTableDefault &
  z.infer<typeof ProjectMemberEntity>;

export class ProjectMemberMapper {
  static convertToDPO(member: User): ProjectMemberDPO {
    return UserMapper.convertToDPO(member, false);
  }

  static convertToPaginatedDPO(
    users: User[],
    paginationMeta: PaginationMeta
  ): PaginatedProjectMemberDPO {
    return {
      ...paginationMeta,
      data: users.map((user) => this.convertToDPO(user)),
    };
  }
}
