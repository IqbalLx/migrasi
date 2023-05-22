import { authService } from '@migrasi/services/api/auth';
import { getDB } from '@migrasi/shared/database';
import {
  Context,
  MemberToAddDPO,
  NewProject,
  PaginatedProjectMemberDPO,
  ProjectMemberPaginationQuery,
} from '@migrasi/shared/entities';
import { projectService } from '.';
import { ProjectNotFoundException } from './impl/project.error';
import { sql } from 'kysely';

describe('Project Member Domain', () => {
  const db = getDB();

  let context: Context;
  let contextUser7: Context;

  let project0ID: string;
  let project1ID: string;

  let thisTestOnlySlug: string;
  let thisTestOnlyProjectID: string;

  const addedMemberIds: string[] = [];

  beforeAll(async () => {
    const [cookieUser1, cookieUser5] = await Promise.all([
      authService.login({
        email: 'user0@email.com',
        password: 'Password123654',
      }),
      authService.login({
        email: 'user7@email.com',
        password: 'Password123654',
      }),
    ]);

    [context, contextUser7] = await Promise.all([
      authService.authorize(cookieUser1.value),
      authService.authorize(cookieUser5.value),
    ]);

    const newProject: NewProject = {
      name: 'Project Member Jest Test',
    };

    const forTestProject = await projectService.createProject(
      context,
      newProject
    );

    thisTestOnlySlug = forTestProject.slug;

    const [project0, project1, thisTestOnlyProject] = await Promise.all([
      db
        .selectFrom('projects')
        .where('slug', '=', 'project-0')
        .select('id')
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('projects')
        .where('slug', '=', 'project-1')
        .select('id')
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('projects')
        .where('slug', '=', thisTestOnlySlug)
        .select('id')
        .executeTakeFirstOrThrow(),
    ]);

    project0ID = project0.id;
    project1ID = project1.id;
    thisTestOnlyProjectID = thisTestOnlyProject.id;
  });

  afterAll(async () => {
    await authService.logout(context.id);
    await authService.logout(contextUser7.id);

    await db
      .deleteFrom('projects')
      .where('slug', 'ilike', `project-member-jest-%`)
      .orWhere('id', '=', thisTestOnlyProjectID)
      .execute();

    await db.destroy();
  });

  it('should successfully search member to add to project', async () => {
    const possibleNewMembers = await projectService.searchMembersToAdd(
      context,
      project0ID,
      'user'
    );

    expect(possibleNewMembers.length).toEqual(10);

    const validation = MemberToAddDPO.safeParse(possibleNewMembers);
    expect(validation.success).toBe(true);
  });

  it('should failed to search member to add when theyre not author', async () => {
    await expect(
      projectService.searchMembersToAdd(contextUser7, project0ID, 'user')
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser7.user_id} not an author of project with slug ${project0ID}`,
        },
        'NOTAUTHOR'
      )
    );
  });

  it('should succesfully add user to a project', async () => {
    const possibleNewMembers = await projectService.searchMembersToAdd(
      context,
      thisTestOnlyProjectID,
      'user'
    );

    const notMemberBefore = possibleNewMembers
      .filter((user) => {
        return !user.is_already_member;
      })
      .slice(0, 3);

    const notMemberBeforeEmails = notMemberBefore.map(
      (user) => user.user.email
    );

    await expect(
      projectService.addMembersToProject(
        context,
        thisTestOnlyProjectID,
        notMemberBeforeEmails
      )
    ).resolves.not.toThrowError();

    notMemberBefore.forEach((user) => addedMemberIds.push(user.user.id));
  });

  it.skip('should successfully invite user outside migrasi account to join project', async () => {
    await expect(
      projectService.addMembersToProject(context, thisTestOnlyProjectID, [
        'iqbal@mbts.dev',
      ])
    ).resolves.not.toThrowError();

    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait for email service called and print the result to console
  }, 6000);

  it('should failed add user to a project when theyre not an author', async () => {
    const possibleNewMembers = await projectService.searchMembersToAdd(
      context,
      thisTestOnlyProjectID,
      'user'
    ); // search with user0 context

    const notMemberBefore = possibleNewMembers
      .filter((user) => !user.is_already_member)
      .map((user) => user.user.email)
      .slice(0, 3);

    await expect(
      projectService.addMembersToProject(
        contextUser7, // and try adding member using user7 context
        thisTestOnlyProjectID,
        notMemberBefore
      )
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser7.user_id} not an author of project with slug ${thisTestOnlyProjectID}`,
        },
        'NOTAUTHOR'
      )
    );
  });

  it('should successfully get project members -- plain no param -- as author', async () => {
    const projectMembers = await projectService.getProjectMembers(
      context,
      {},
      project0ID
    );

    expect(projectMembers.current.page).toEqual(1);
    expect(projectMembers.current.rows).toEqual(projectMembers.data.length);

    const validation = PaginatedProjectMemberDPO.safeParse(projectMembers);
    expect(validation.success).toBe(true);
  });

  it('should successfully get project members -- plain no param -- as member', async () => {
    const projectMembers = await projectService.getProjectMembers(
      contextUser7,
      {},
      project1ID
    );

    expect(projectMembers.current.page).toEqual(1);
    expect(projectMembers.current.rows).toEqual(projectMembers.data.length);
  });

  it('should failed get project members -- plain no param -- as outsider', async () => {
    await expect(
      projectService.getProjectMembers(contextUser7, {}, project0ID)
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser7.user_id} not an author of project with slug ${project0ID}`,
        },
        'NOTMEMBER'
      )
    );
  });

  it('should successfully get project members --  with sort param', async () => {
    const projectMemberQuery: ProjectMemberPaginationQuery = {
      sort: {
        contribution: 'desc',
      },
    };

    const projectMembers = await projectService.getProjectMembers(
      context,
      projectMemberQuery,
      project0ID
    );

    const contributionsOrder = projectMembers.data.map(
      (member) => member.contributions
    );
    const contributionsDescOrder = [...contributionsOrder].sort(
      (a, b) => b - a
    );

    expect(contributionsOrder).toEqual(contributionsDescOrder);
  });

  it('should successfully get project members --  with filter param', async () => {
    const projectMemberQuery: ProjectMemberPaginationQuery = {
      filter: {
        email: 'user4@email.com',
      },
    };

    const projectMembers = await projectService.getProjectMembers(
      context,
      projectMemberQuery,
      project0ID
    );

    expect(projectMembers.current.rows).toEqual(projectMembers.data.length);
    expect(projectMembers.total.rows).toEqual(1);
    expect(projectMembers.data[0].email).toEqual(
      projectMemberQuery.filter?.email
    );
  });

  it('should successfully delete member from project', async () => {
    await expect(
      projectService.deleteMembersFromProject(
        context,
        thisTestOnlyProjectID,
        addedMemberIds.slice(0, 2)
      )
    ).resolves.not.toThrowError();

    const member = await db
      .selectFrom('project_members as pm')
      .where('pm.project_id', '=', thisTestOnlyProjectID)
      .where('pm.member_id', '!=', context.user_id) // excluding author
      .select(sql<string>`coalesce(count(pm.id), 0)`.as('count'))
      .executeTakeFirstOrThrow();

    expect(Number(member.count)).toEqual(1);
  });

  it('should implicitly excluding author removing themselves from a project', async () => {
    await expect(
      projectService.deleteMembersFromProject(context, thisTestOnlyProjectID, [
        context.user_id,
        addedMemberIds[2],
      ])
    ).resolves.not.toThrowError();

    const member = await db
      .selectFrom('project_members as pm')
      .where('pm.project_id', '=', thisTestOnlyProjectID)
      .select(sql<string>`coalesce(count(pm.id), 0)`.as('count'))
      .executeTakeFirstOrThrow();

    expect(Number(member.count)).toEqual(1); // only author is left
  });

  it('should failed non-author to remove project', async () => {
    await expect(
      projectService.deleteMembersFromProject(
        contextUser7,
        thisTestOnlyProjectID,
        [context.user_id, addedMemberIds[2]]
      )
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser7.user_id} not an author of project with slug ${thisTestOnlyProjectID}`,
        },
        'NOTAUTHOR'
      )
    );
  });
});
