import { authService } from '@migrasi/services/api/auth';
import { getDB } from '@migrasi/shared/database';
import { Context, MemberToAddDPO, NewProject } from '@migrasi/shared/entities';
import { projectService } from '.';
import { ProjectNotFoundException } from './impl/project.error';

describe('Project Member Domain', () => {
  const db = getDB();

  let context: Context;
  let contextUser7: Context;

  let project0ID: string;
  let project1ID: string;

  let thisTestOnlySlug: string;
  let thisTestOnlyProjectID: string;

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
      .map((user) => user.user.email)
      .slice(0, 3);

    await expect(
      projectService.addMembersToProject(
        context,
        thisTestOnlyProjectID,
        notMemberBefore
      )
    ).resolves.not.toThrowError();
  });

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
});
