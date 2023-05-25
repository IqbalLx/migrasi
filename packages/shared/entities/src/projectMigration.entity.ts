import { z } from 'zod';
import {
  KyselyTableDefault,
  PaginationMeta,
  PaginationQuery,
  TableDefault,
  mapTableDefault,
  omitTimestamp,
  wrapInPagination,
} from './common';
import { User, UserDPO, UserMapper } from './user.entity';

import { toUnixInSeconds } from '@migrasi/shared/utils';
import { Generated } from 'kysely';

const ProjectMigrationEntity = z.object({
  project_id: z.string(),
  created_by: z.string().uuid(),
  filename: z.string().min(3),
  sequence: z.number(),
  is_migrated: z.boolean().default(false),
});

export const ProjectMigration = ProjectMigrationEntity.merge(TableDefault);
export const NewProjectMigration = ProjectMigrationEntity.omit({
  sequence: true,
  is_migrated: true,
});
export const UpdateProjectMigrationDTO = z.object({
  current_filename: z.string(),
  updated_filename: z.string(),
});
export const ProjectMigrationDPO = ProjectMigration.omit({
  project_id: true,
  created_by: true,
}).merge(
  z.object({
    created_by: omitTimestamp(UserDPO),
  })
);
export const PaginatedProjectMigrationDPO =
  wrapInPagination(ProjectMigrationDPO);

export const ProjectMigrationQueryOptions = z
  .object({
    sort: z.enum(['asc', 'desc']),
    filter: z.object({
      search: z.string().min(3),
      start_date: z.number(),
      end_date: z.number().lte(toUnixInSeconds(new Date())),
      author_id: z.string(),
    }),
  })
  .merge(PaginationQuery)
  .deepPartial();

export type ProjectMigration = z.infer<typeof ProjectMigration>;
export type NewProjectMigration = z.infer<typeof NewProjectMigration>;
export type ProjectMigrationDPO = z.infer<typeof ProjectMigrationDPO>;
export type UpdateProjectMigrationDTO = z.infer<
  typeof UpdateProjectMigrationDTO
>;
export type PaginatedProjectMigrationDPO = z.infer<
  typeof PaginatedProjectMigrationDPO
>;
export type ProjectMigrationQueryOptions = z.infer<
  typeof ProjectMigrationQueryOptions
>;

export type ProjectMigrationTable = KyselyTableDefault &
  z.infer<typeof ProjectMigrationEntity> & {
    is_migrated: Generated<boolean>;
  };

export class ProjectMigrationMapper {
  static convertToDPO(
    projectMigration: ProjectMigration,
    author: User
  ): ProjectMigrationDPO {
    return {
      ...mapTableDefault(projectMigration, true),
      filename: projectMigration.filename,
      sequence: projectMigration.sequence,
      created_by: UserMapper.convertToDPO(author, false),
    };
  }

  static convertToPaginatedDPO(
    datas: {
      projectMigration: ProjectMigration;
      author: User;
    }[],
    paginationMeta: PaginationMeta
  ): PaginatedProjectMigrationDPO {
    return {
      ...paginationMeta,
      data: datas.map((data) =>
        this.convertToDPO(data.projectMigration, data.author)
      ),
    };
  }
}
