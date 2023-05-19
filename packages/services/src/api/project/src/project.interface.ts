import {
  Context,
  NewProject,
  PaginatedProjectMigrationDPO,
  Project,
  ProjectDPO,
  ProjectMigrationQueryOptions,
  UpdatedProject,
} from '@migrasi/shared/entities';

export interface IProjectService {
  create(
    context: Context,
    newProject: NewProject
  ): Promise<Pick<Project, 'slug'>>;
  getProjectDetail(context: Context, projectId: string): ProjectDPO;
  getProjectMigrations(
    context: Context,
    query: ProjectMigrationQueryOptions,
    projectId: string
  ): PaginatedProjectMigrationDPO;
  update(
    context: Context,
    projectId: string,
    updatedProject: UpdatedProject
  ): Promise<Pick<Project, 'slug'>>;
}
