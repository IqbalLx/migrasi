import {
  Context,
  ListProjectDPO,
  MemberToAddDPO,
  NewMembers,
  NewProject,
  NewProjectMigration,
  PaginatedProjectMemberDPO,
  PaginatedProjectMigrationDPO,
  Project,
  ProjectDPO,
  ProjectMapper,
  ProjectMemberMapper,
  ProjectMemberPaginationQuery,
  ProjectMigrationDPO,
  ProjectMigrationMapper,
  ProjectMigrationQueryOptions,
  UpdateProjectMigrationDTO,
} from '@migrasi/shared/entities';
import { EmailBridge } from '@migrasi/shared/bridges/email';
import { IProjectRepository, IProjectService } from '../project.interface';

import { randomUUID } from 'crypto';
import { ProjectValidator } from './project.validator';

export class ProjectService implements IProjectService {
  constructor(
    private projectRepo: IProjectRepository,
    private projectValidator: ProjectValidator,
    private emailBridge: EmailBridge
  ) {}

  // Project
  private generateSlug(name: string): string {
    const lastFragmentUUID = randomUUID().split('-').splice(-1)[0];
    return `${name
      .toLocaleLowerCase()
      .split(' ')
      .join('-')}-${lastFragmentUUID}`;
  }

  async createProject(
    context: Context,
    newProject: NewProject
  ): Promise<Pick<Project, 'slug'>> {
    const slug = this.generateSlug(newProject.name);

    await this.projectRepo.createProject({
      ...newProject,
      slug,
      author_id: context.user_id,
    });

    return { slug };
  }

  getAllProjects(context: Context): Promise<ListProjectDPO> {
    return this.projectRepo.getAllProjects(context.user_id);
  }

  async getProjectDetail(
    context: Context,
    projectSlug: string
  ): Promise<ProjectDPO> {
    const [project, author] = await this.projectValidator.validateAndGetProject(
      context.user_id,
      projectSlug
    );

    // populate project data
    const TOP_MEMBERS_LIMIT = 5;
    const INITIAL_MIGRATIONS_LIMIT = 20;
    const [totalMembers, topMembers, migrations] = await Promise.all([
      this.projectRepo.countMembers(project.id),
      this.projectRepo.getMembers(project.id, {
        page: 1,
        size: TOP_MEMBERS_LIMIT,
        sort: {
          contribution: 'desc',
        },
      }),
      this.projectRepo.getMigrationsWithPaginationMeta(project.id, {
        page: 1,
        size: INITIAL_MIGRATIONS_LIMIT,
      }),
    ]);

    return ProjectMapper.convertToDPO(
      project,
      author,
      totalMembers,
      topMembers,
      migrations
    );
  }

  async deleteProject(context: Context, projectId: string): Promise<void> {
    await this.projectValidator.validateProject(
      context.user_id,
      projectId,
      true
    );

    return this.projectRepo.deleteProject(projectId);
  }

  // Project Member
  async searchMembersToAdd(
    context: Context,
    projectId: string,
    memberEmailOrName: string
  ): Promise<MemberToAddDPO> {
    await this.projectValidator.validateProject(
      context.user_id,
      projectId,
      true
    );

    const SEARCH_RESULT_LIMIT = 10;
    const seacrhRes = await this.projectRepo.searchMembersToAdd(
      projectId,
      memberEmailOrName,
      SEARCH_RESULT_LIMIT
    );

    return seacrhRes.map((member) =>
      ProjectMemberMapper.convertToNewMemberToAddDPO(member)
    );
  }

  async addMembersToProject(
    context: Context,
    projectId: string,
    memberEmails: NewMembers
  ): Promise<void> {
    const [project, author] = await this.projectValidator.validateAndGetProject(
      context.user_id,
      projectId,
      true
    );

    const validNewMembers = await this.projectValidator.filterValidNewMembers(
      memberEmails,
      projectId
    );

    await Promise.all(
      validNewMembers.map((newMember) => {
        if (newMember.userId === null) {
          this.emailBridge.emit('send', newMember.email, {
            subject: `You are invited to join ${project.name} on Migrasi!`,
            text: `${author.name} has invite you to collborate on ${project.name}. Don't keep them waiting, click this link to join your team @Migrasi now`,
            priority: 'high',
          });

          return;
        }

        return this.projectRepo.createNewProjectMember(
          newMember.userId,
          projectId
        );
      })
    );
  }

  async getProjectMembers(
    context: Context,
    query: ProjectMemberPaginationQuery,
    projectId: string
  ): Promise<PaginatedProjectMemberDPO> {
    await this.projectValidator.validateProject(
      context.user_id,
      projectId,
      false
    );

    const [datas, pagination] =
      await this.projectRepo.getMembersWithPaginationMeta(projectId, query);

    return ProjectMemberMapper.convertToPaginatedDPO(datas, pagination);
  }

  async deleteMembersFromProject(
    context: Context,
    projectId: string,
    memberIds: string[]
  ): Promise<void> {
    await this.projectValidator.validateProject(
      context.user_id,
      projectId,
      true
    );

    const validDeletedMemberIds =
      await this.projectValidator.filterValidToBeDeletedMembers(
        memberIds,
        projectId
      );

    return this.projectRepo.deleteMembers(projectId, validDeletedMemberIds);
  }

  // Project Migration
  async createMigration(
    context: Context,
    projectOrSlugId: string,
    filename: string
  ): Promise<string> {
    const [project] = await this.projectValidator.validateAndGetProject(
      context.user_id,
      projectOrSlugId,
      false
    );

    const newMigration: NewProjectMigration = {
      filename,
      project_id: project.id,
      created_by: context.user_id,
    };

    return this.projectRepo.createMigration(newMigration);
  }

  async getProjectMigrations(
    context: Context,
    query: ProjectMigrationQueryOptions,
    projectId: string
  ): Promise<PaginatedProjectMigrationDPO> {
    await this.projectValidator.validateProject(
      context.user_id,
      projectId,
      false
    );

    const [datas, pagination] =
      await this.projectRepo.getMigrationsWithPaginationMeta(projectId, query);

    return ProjectMigrationMapper.convertToPaginatedDPO(datas, pagination);
  }

  async getAllProjectMigrations(
    context: Context,
    projectIdOrSlug: string
  ): Promise<ProjectMigrationDPO[]> {
    const [project] = await this.projectValidator.validateAndGetProject(
      context.user_id,
      projectIdOrSlug,
      false
    );

    const migrations = await this.projectRepo.getMigrations(project.id, {
      page: 1,
      size: -1,
      sort: 'asc',
    });

    return migrations.map((migration) =>
      ProjectMigrationMapper.convertToDPO(
        migration.projectMigration,
        migration.author
      )
    );
  }

  async updateMigration(
    context: Context,
    projectSlugOrId: string,
    updateMigration: UpdateProjectMigrationDTO
  ): Promise<void> {
    const [, migration] = await Promise.all([
      this.projectValidator.validateProject(
        context.user_id,
        projectSlugOrId,
        false
      ),
      this.projectValidator.validateAndGetProjectMigration(
        context.user_id,
        projectSlugOrId,
        updateMigration.current_filename
      ),
    ]);

    return this.projectRepo.updateMigration(migration.id, {
      filename: updateMigration.updated_filename,
    });
  }

  async toggleMigrationStatus(
    context: Context,
    projectSlugOrId: string,
    lastFilename: string
  ): Promise<void> {
    const [, migration] = await Promise.all([
      this.projectValidator.validateProject(
        context.user_id,
        projectSlugOrId,
        true
      ),
      this.projectValidator.validateAndGetProjectMigration(
        context.user_id,
        projectSlugOrId,
        lastFilename,
        false
      ),
    ]);

    return this.projectRepo.batchToggleMigrationStatus(
      migration.project_id,
      migration.sequence
    );
  }

  async deleteProjectMigration(
    context: Context,
    projectSlugOrId: string,
    filename: string
  ): Promise<void> {
    const [, migration] = await Promise.all([
      this.projectValidator.validateProject(
        context.user_id,
        projectSlugOrId,
        false
      ),
      this.projectValidator.validateAndGetProjectMigration(
        context.user_id,
        projectSlugOrId,
        filename
      ),
    ]);

    return this.projectRepo.deleteMigration(migration.id);
  }
}
