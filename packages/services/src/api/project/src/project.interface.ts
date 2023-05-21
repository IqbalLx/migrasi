import {
  Context,
  MemberToAddDPO,
  NewMembers,
  NewProject,
  PaginatedProjectMemberDPO,
  PaginatedProjectMigrationDPO,
  PaginationMeta,
  Project,
  ProjectDPO,
  ProjectMemberPaginationQuery,
  ProjectMigration,
  ProjectMigrationQueryOptions,
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
  getProjectMigrations(
    context: Context,
    query: ProjectMigrationQueryOptions,
    projectId: string
  ): Promise<PaginatedProjectMigrationDPO>;
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
}
