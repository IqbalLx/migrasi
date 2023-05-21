import { Project, User } from '@migrasi/shared/entities';
import { IProjectRepository } from '../project.interface';
import { ProjectNotFoundException } from './project.error';

export class ProjectValidator {
  constructor(private projectRepo: IProjectRepository) {}

  private async validate<
    C extends boolean,
    R = C extends true ? Promise<[Project, User]> : undefined
  >(
    userId: string,
    projectSlugOrId: string,
    returnProject: C,
    mustAuthor?: boolean
  ): Promise<R> {
    const project = await this.projectRepo.getProject(projectSlugOrId);

    if (project === undefined) {
      throw new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `project with slug ${projectSlugOrId} not found`,
        },
        'NOTFOUND'
      );
    }

    const isAuthor = userId === project[1].id;
    if (mustAuthor && !isAuthor)
      throw new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${userId} not an author of project with slug ${projectSlugOrId}`,
        },
        'NOTAUTHOR'
      );

    if (isAuthor) return (returnProject ? project : undefined) as R;

    const isMember = await this.projectRepo.isMemberOf(userId, project[0].id);
    if (!isMember)
      throw new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${userId} not a member of project with slug ${projectSlugOrId}`,
        },
        'NOTMEMBER'
      );

    return (returnProject ? project : undefined) as R;
  }

  validateProject(userId: string, projectSlugOrId: string, mustAuthor = false) {
    return this.validate(userId, projectSlugOrId, false, mustAuthor);
  }
  validateAndGetProject(
    userId: string,
    projectSlugOrId: string,
    mustAuthor = false
  ) {
    return this.validate(userId, projectSlugOrId, true, mustAuthor);
  }

  async filterValidNewMembers(memberEmails: string[], projectId: string) {
    const memberStatuses = await Promise.all(
      memberEmails.map((memberEmail) =>
        this.projectRepo.getAccountAndMemberStatus(memberEmail, projectId)
      )
    );

    const validNewMembers: {
      userId: string | null;
      email: string;
    }[] = [];
    memberStatuses.forEach((memberStatus, index) => {
      if (memberStatus.userId === null || !memberStatus.alreadyMember)
        validNewMembers.push({
          userId: memberStatus.userId,
          email: memberEmails[index],
        });
    });
    return validNewMembers;
  }

  async filterValidToBeDeletedMembers(memberIds: string[], projectId: string) {
    const memberExists = await Promise.all(
      memberIds.map((memberId) =>
        this.projectRepo.isMemberOf(memberId, projectId)
      )
    );
    const validDeletedMemberIds = memberIds.filter(
      (_, index) => memberExists[index]
    );

    return validDeletedMemberIds;
  }
}
