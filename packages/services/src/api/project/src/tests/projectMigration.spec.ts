import { authService } from '@migrasi/services/api/auth';
import { getDB } from '@migrasi/shared/database';
import {
  Context,
  PaginatedProjectMigrationDPO,
  ProjectMigrationQueryOptions,
} from '@migrasi/shared/entities';
import { projectService } from '..';
import { ProjectNotFoundException } from '../impl/project.error';

describe('Project Migration Domain', () => {
  const db = getDB();

  let context: Context;
  let contextUser3: Context; // member of project authored by user0
  let contextUser1: Context; // outsider in project0

  let project0ID: string;
  let project1ID: string;

  beforeAll(async () => {
    const [cookieUser0, cookieUser1, cookieUser3] = await Promise.all([
      authService.login({
        email: 'user0@email.com',
        password: 'Password123654',
      }),
      authService.login({
        email: 'user1@email.com',
        password: 'Password123654',
      }),
      authService.login({
        email: 'user3@email.com',
        password: 'Password123654',
      }),
    ]);

    [context, contextUser1, contextUser3] = await Promise.all([
      authService.authorize(cookieUser0.value),
      authService.authorize(cookieUser1.value),
      authService.authorize(cookieUser3.value),
    ]);

    const [project0, project1] = await Promise.all([
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
    ]);

    project0ID = project0.id;
    project1ID = project1.id;
  });

  afterAll(async () => {
    await authService.logout(context.id);
    await authService.logout(contextUser1.id);
    await authService.logout(contextUser3.id);

    await db.destroy();
  });

  it('should succesfully get all migrations of a project -- no param -- as author', async () => {
    const projectMigrations = await projectService.getProjectMigrations(
      context,
      {},
      project0ID
    );

    expect(projectMigrations.current.rows).toEqual(
      projectMigrations.data.length
    );
    expect(projectMigrations.current.page).toEqual(1);

    const validation =
      PaginatedProjectMigrationDPO.safeParse(projectMigrations);
    expect(validation.success).toBe(true);

    const projectMigrationSequenceOrder = projectMigrations.data.map(
      (pm) => pm.sequence
    );
    const projectMigrationSequenceDescOrder = [
      ...projectMigrationSequenceOrder,
    ].sort((a, b) => b - a);

    expect(projectMigrationSequenceOrder).toEqual(
      projectMigrationSequenceDescOrder
    );
  });

  it('should succesfully get all migrations of a project -- with pagination query -- as author', async () => {
    const projectMigrationQuery: ProjectMigrationQueryOptions = {
      page: 1,
      size: 3,
    };
    const projectMigrations = await projectService.getProjectMigrations(
      context,
      projectMigrationQuery,
      project0ID
    );

    expect(projectMigrations.current.rows).toEqual(
      projectMigrations.data.length
    );
    expect(projectMigrations.current.page).toEqual(1);

    // validate data consistency
    expect(projectMigrations.total.pages).toEqual(
      Math.ceil(
        projectMigrations.total.rows / (projectMigrationQuery.size ?? 3)
      )
    );
  });

  it('should succesfully get all migrations of a project -- with sort query -- as author', async () => {
    const projectMigrationQuery: ProjectMigrationQueryOptions = {
      sort: 'asc',
    };
    const projectMigrations = await projectService.getProjectMigrations(
      context,
      projectMigrationQuery,
      project0ID
    );

    const projectMigrationSequenceOrder = projectMigrations.data.map(
      (pm) => pm.sequence
    );
    const projectMigrationSequenceAscOrder = [
      ...projectMigrationSequenceOrder,
    ].sort((a, b) => a - b);

    expect(projectMigrationSequenceOrder).toEqual(
      projectMigrationSequenceAscOrder
    );
  });

  it('should succesfully get all migrations of a project -- with author filter -- as author', async () => {
    const projectMigrationQuery: ProjectMigrationQueryOptions = {
      filter: {
        author_id: contextUser1.user_id,
      },
    };
    const projectMigrations = await projectService.getProjectMigrations(
      context,
      projectMigrationQuery,
      project0ID
    );

    const allAuthoredByUser1 = projectMigrations.data.every(
      (pm) => pm.created_by.id === contextUser1.user_id
    );
    expect(allAuthoredByUser1).toBe(true);
  });

  it('should succesfully get all migrations of a project -- no param -- as member', async () => {
    const projectMigrations = await projectService.getProjectMigrations(
      contextUser3,
      {},
      project0ID
    );

    expect(projectMigrations.current.rows).toEqual(
      projectMigrations.data.length
    );
    expect(projectMigrations.current.page).toEqual(1);

    const validation =
      PaginatedProjectMigrationDPO.safeParse(projectMigrations);
    expect(validation.success).toBe(true);

    const projectMigrationSequenceOrder = projectMigrations.data.map(
      (pm) => pm.sequence
    );
    const projectMigrationSequenceDescOrder = [
      ...projectMigrationSequenceOrder,
    ].sort((a, b) => b - a);

    expect(projectMigrationSequenceOrder).toEqual(
      projectMigrationSequenceDescOrder
    );
  });

  it('should failed get all migrations of a project as an outsider', async () => {
    await expect(
      projectService.getProjectMigrations(context, {}, project1ID)
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser1} not an author of project with slug ${project1ID}`,
        },
        'NOTMEMBER'
      )
    );
  });
});
