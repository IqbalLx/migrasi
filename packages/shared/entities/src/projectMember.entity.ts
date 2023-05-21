import { z } from 'zod';
import {
  KyselyTableDefault,
  PaginationMeta,
  PaginationQuery,
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
export const ProjectMemberDPO = omitTimestamp(UserDPO).merge(
  z.object({
    contributions: z.number().nonnegative(),
  })
);
export const PaginatedProjectMemberDPO = wrapInPagination(ProjectMemberDPO);

export const ProjectMemberPaginationQuery = z
  .object({
    sort: z.object({
      contribution: z.enum(['asc', 'desc']),
      name: z.enum(['asc', 'desc']),
    }),
    filter: z.object({
      name: z.string().min(3),
      email: z.string().min(3),
    }),
  })
  .merge(PaginationQuery)
  .deepPartial();

export const NewMembers = z.array(z.string().email());
export const MemberToAddDPO = z.array(
  z.object({ is_already_member: z.boolean() }).merge(
    z.object({
      user: omitTimestamp(UserDPO),
    })
  )
);

const a = omitTimestamp(UserDPO);
export type a = z.infer<typeof a>;

export type ProjectMember = z.infer<typeof ProjectMember>;
export type ProjectMemberDPO = z.infer<typeof ProjectMemberDPO>;
export type PaginatedProjectMemberDPO = z.infer<
  typeof PaginatedProjectMemberDPO
>;
export type ProjectMemberPaginationQuery = z.infer<
  typeof ProjectMemberPaginationQuery
>;

export type NewMembers = z.infer<typeof NewMembers>;
export type MemberToAddDPO = z.infer<typeof MemberToAddDPO>;

export type ProjectMemberTable = KyselyTableDefault &
  z.infer<typeof ProjectMemberEntity>;

export class ProjectMemberMapper {
  static convertToDPO(member: User, contributions: number): ProjectMemberDPO {
    return {
      ...UserMapper.convertToDPO(member, false),
      contributions,
    };
  }

  static convertToPaginatedDPO(
    datas: { user: User; contributions: number }[],
    paginationMeta: PaginationMeta
  ): PaginatedProjectMemberDPO {
    return {
      ...paginationMeta,
      data: datas.map((data) =>
        this.convertToDPO(data.user, data.contributions)
      ),
    };
  }

  static convertToNewMemberToAddDPO(
    data: User & { is_already_member: boolean }
  ) {
    return {
      user: UserMapper.convertToDPO(data, false),
      is_already_member: data.is_already_member,
    };
  }
}
