import {
  Context,
  MemberToAddDPO,
  NewMembers,
  NewProject,
  PaginatedProjectMemberDPO,
  PaginatedProjectMigrationDPO,
  Project,
  ProjectDPO,
  ProjectMapper,
  ProjectMemberMapper,
  ProjectMemberPaginationQuery,
  ProjectMigrationMapper,
  ProjectMigrationQueryOptions,
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
      this.projectRepo.getMigrations(project.id, {
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
}
