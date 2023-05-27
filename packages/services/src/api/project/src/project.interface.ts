import {
  Context,
  MemberToAddDPO,
  NewMembers,
  NewProject,
  NewProjectMigration,
  PaginatedProjectMemberDPO,
  PaginatedProjectMigrationDPO,
  PaginationMeta,
  Project,
  ProjectDPO,
  ProjectMemberPaginationQuery,
  ProjectMigration,
  ProjectMigrationDPO,
  ProjectMigrationQueryOptions,
  UpdateProjectMigrationDTO,
  User,
  WithoutTableDefault,
} from '@migrasi/shared/entities';

export interface IProjectService {
  // projects
  createProject(
    context: Context,
    newProject: NewProject
  ): Promise<Pick<Project, 'slug'>>;
  getProjectDetail(context: Context, projectId: string): Promise<ProjectDPO>;
  deleteProject(context: Context, projectId: string): Promise<void>;

  // project members
  searchMembersToAdd(
    context: Context,
    projectId: string,
    memberEmailOrName: string
  ): Promise<MemberToAddDPO>;
  addMembersToProject(
    context: Context,
    projectId: string,
    memberEmails: NewMembers
  ): Promise<void>;
  getProjectMembers(
    context: Context,
    query: ProjectMemberPaginationQuery,
    projectId: string
  ): Promise<PaginatedProjectMemberDPO>;
  deleteMembersFromProject(
    context: Context,
    projectId: string,
    memberIds: string[]
  ): Promise<void>;

  // project migrations
  createMigration(
    context: Context,
    projectSlugOrId: string,
    filename: string
  ): Promise<string>;
  getProjectMigrations(
    context: Context,
    query: ProjectMigrationQueryOptions,
    projectId: string
  ): Promise<PaginatedProjectMigrationDPO>;
  getAllProjectMigrations(
    context: Context,
    projectIdOrSlug: string
  ): Promise<ProjectMigrationDPO[]>;
  updateMigration(
    context: Context,
    projectSlugOrId: string,
    updateMigration: UpdateProjectMigrationDTO
  ): Promise<void>;
  toggleMigrationStatus(
    context: Context,
    projectSlugOrId: string,
    lastFilename: string
  ): Promise<void>;
  deleteProjectMigration(
    context: Context,
    projectSlugOrId: string,
    filename: string
  ): Promise<void>;
}

export interface IProjectRepository {
  // projects
  createProject(newProject: WithoutTableDefault<Project>): Promise<void>;
  getProject(
    projectIdOrSlug: string
  ): Promise<[project: Project, author: User] | undefined>;
  deleteProject(projectId: string): Promise<void>;

  // project members
  searchMembersToAdd(
    projectId: string,
    memberEmailOrName: string,
    limit?: number
  ): Promise<Array<User & { is_already_member: boolean }>>;
  createNewProjectMember(memberId: string, projectId: string): Promise<void>;
  isMemberOf(userId: string, projectId: string): Promise<boolean>;
  getAccountAndMemberStatus(
    email: string,
    projectId: string
  ): Promise<{ userId: string | null; alreadyMember: boolean }>;
  countMembers(projectId: string): Promise<number>;
  getMembers(
    projectId: string,
    query: ProjectMemberPaginationQuery
  ): Promise<{ user: User; contributions: number }[]>;
  getMembersWithPaginationMeta(
    projectId: string,
    query: ProjectMemberPaginationQuery
  ): Promise<[{ user: User; contributions: number }[], PaginationMeta]>;
  deleteMembers(projectId: string, memberIds: string[]): Promise<void>;

  // project migrations
  createMigration(newMigration: NewProjectMigration): Promise<string>;
  getMigrationByFilename(
    projectSlugOrId: string,
    filename: string
  ): Promise<ProjectMigration | undefined>;
  getMigrations(
    projectId: string,
    query: ProjectMigrationQueryOptions
  ): Promise<Array<{ author: User; projectMigration: ProjectMigration }>>;
  getMigrationsWithPaginationMeta(
    projectId: string,
    query: ProjectMigrationQueryOptions
  ): Promise<
    [
      Array<{ author: User; projectMigration: ProjectMigration }>,
      PaginationMeta
    ]
  >;
  updateMigration(
    id: string,
    updateValue: Partial<Pick<ProjectMigration, 'filename' | 'is_migrated'>>
  ): Promise<void>;
  batchToggleMigrationStatus(
    projectId: string,
    lastSequence: number
  ): Promise<void>;
  batchUpdateMigration(
    ids: string[],
    updateValue: Partial<Pick<ProjectMigration, 'filename' | 'is_migrated'>>
  ): Promise<void>;
  deleteMigration(id: string): Promise<void>;
}
