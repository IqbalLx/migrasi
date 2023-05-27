import { z } from 'zod';
import {
  KyselyTableDefault,
  PaginationMeta,
  TableDefault,
  mapTableDefault,
  omitTimestamp,
} from './common';
import { User, UserDPO, UserMapper } from './user.entity';
import {
  PaginatedProjectMigrationDPO,
  ProjectMigration,
  ProjectMigrationMapper,
} from './projectMigration.entity';
import { ProjectMemberMapper } from './projectMember.entity';

const ProjectEntity = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  author_id: z.string().uuid(),
});

export const Project = ProjectEntity.merge(TableDefault);
export const NewProject = ProjectEntity.pick({ name: true });
export const UpdatedProject = ProjectEntity.pick({ name: true }).partial();
export const ProjectDPO = Project.omit({ author_id: true, slug: true }).merge(
  z.object({
    author: omitTimestamp(UserDPO),
    total_members: z.number(),
    top_5_members: z.array(omitTimestamp(UserDPO)).max(5),
    migrations: PaginatedProjectMigrationDPO,
  })
);

export type Project = z.infer<typeof Project>;
export type NewProject = z.infer<typeof NewProject>;
export type UpdatedProject = z.infer<typeof UpdatedProject>;
export type ProjectDPO = z.infer<typeof ProjectDPO>;

export type ProjectTable = KyselyTableDefault & z.infer<typeof ProjectEntity>;

export class ProjectMapper {
  static convertToDPO(
    project: Project,
    author: User,
    totalMembers: number,
    top5Members: { user: User; contributions: number }[],
    migrations: [
      migrations: {
        projectMigration: ProjectMigration;
        author: User;
      }[],
      paginationMeta: PaginationMeta
    ]
  ): ProjectDPO {
    return {
      ...mapTableDefault(project, true),
      name: project.name,
      author: UserMapper.convertToDPO(author, false),
      total_members: totalMembers,
      top_5_members: top5Members.map((member) =>
        ProjectMemberMapper.convertToDPO(member.user, member.contributions)
      ),
      migrations: ProjectMigrationMapper.convertToPaginatedDPO(...migrations),
    };
  }
}
