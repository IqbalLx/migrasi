import { z } from 'zod';
import {
  KyselyTableDefault,
  PaginationMeta,
  TableDefault,
  mapTableDefault,
  omitTimestamp,
  wrapInPagination,
} from './common';
import { User, UserDPO, UserMapper } from './user.entity';

import { toUnixInSeconds } from '@migrasi/shared/utils';

const ProjectMigrationEntity = z.object({
  project_id: z.string(),
  created_by: z.string().uuid(),
  filename: z.string().min(3),
  sequence: z.number(),
});

export const ProjectMigration = ProjectMigrationEntity.merge(TableDefault);
export const NewProjectMigration = ProjectMigrationEntity.omit({
  sequence: true,
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
    page: z.number().int().min(1).default(1),
    size: z.number().int().default(20),
    filter: z.object({
      search: z.string().min(3),
      start_date: z.number(),
      end_date: z.number().lte(toUnixInSeconds(new Date())),
      author_id: z.string(),
    }),
  })
  .deepPartial();

export type ProjectMigration = z.infer<typeof ProjectMigration>;
export type NewProjectMigration = z.infer<typeof NewProjectMigration>;
export type ProjectMigrationDPO = z.infer<typeof ProjectMigrationDPO>;
export type PaginatedProjectMigrationDPO = z.infer<
  typeof PaginatedProjectMigrationDPO
>;
export type ProjectMigrationQueryOptions = z.infer<
  typeof ProjectMigrationQueryOptions
>;

export type ProjectMigrationTable = KyselyTableDefault &
  z.infer<typeof ProjectMigrationEntity>;

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
      user: User;
    }[],
    paginationMeta: PaginationMeta
  ): PaginatedProjectMigrationDPO {
    return {
      ...paginationMeta,
      data: datas.map((data) =>
        this.convertToDPO(data.projectMigration, data.user)
      ),
    };
  }
}
