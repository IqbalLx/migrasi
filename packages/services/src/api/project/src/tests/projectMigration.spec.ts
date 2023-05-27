import { authService } from '@migrasi/services/api/auth';
import { getDB } from '@migrasi/shared/database';
import {
  Context,
  PaginatedProjectMigrationDPO,
  ProjectMigrationQueryOptions,
} from '@migrasi/shared/entities';
import { projectService } from '..';
import {
  ProjectMigrationForbiddenException,
  ProjectNotFoundException,
} from '../impl/project.error';

describe('Project Migration Domain', () => {
  const db = getDB();

  let context: Context;
  let contextUser3: Context; // member of project authored by user0
  let contextUser1: Context; // outsider in project0

  let project0ID: string;
  let project1ID: string;

  let sampleFilename: string;
  let sampleFilename2: string;

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

    await db
      .deleteFrom('project_migrations')
      .where('project_id', '=', project0ID)
      .where('sequence', '>', 9)
      .execute();

    // reset is_migrated status from test
    await db
      .updateTable('project_migrations')
      .set({ is_migrated: false })
      .where('project_id', '=', project0ID)
      .execute();

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

    expect(projectMigrations.data.every((mi) => mi.deleted_at === null)).toBe(
      true
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

  it('should succesfully create new migration', async () => {
    const originalFilename = 'create_table_user';
    const generatedFilename = await projectService.createMigration(
      context,
      project0ID,
      originalFilename
    );

    const originalFilename2 = 'create_table_order';
    const generatedFilename2 = await projectService.createMigration(
      context,
      project0ID,
      originalFilename2
    );

    expect(generatedFilename).toEqual(`10_${originalFilename}`);
    expect(generatedFilename2).toEqual(`11_${originalFilename2}`);

    sampleFilename = originalFilename;
    sampleFilename2 = originalFilename2;
  });

  it('should succesfully update migration when it still not migrated', async () => {
    const updatedFilename = `${sampleFilename}_updated`;
    await expect(
      projectService.updateMigration(context, project0ID, {
        current_filename: sampleFilename,
        updated_filename: updatedFilename,
      })
    ).resolves.not.toThrowError();

    sampleFilename = updatedFilename;
  });

  it('should success toggle migration status up until last sequence', async () => {
    await expect(
      projectService.toggleMigrationStatus(context, project0ID, sampleFilename)
    ).resolves.not.toThrowError();

    const migrations = await projectService.getProjectMigrations(
      context,
      {},
      project0ID
    );

    expect(
      migrations.data
        .filter((mi) => mi.sequence < 11)
        .every((mi) => mi.is_migrated)
    ).toBe(true);
  });

  it('should failed to update migration because its already migrated', async () => {
    const updatedFilename = `${sampleFilename}_updated`;
    await expect(
      projectService.updateMigration(context, project0ID, {
        current_filename: sampleFilename,
        updated_filename: updatedFilename,
      })
    ).rejects.toThrowError(
      new ProjectMigrationForbiddenException({
        message: 'Project migration already migrated',
        internal_message: `you cannot update already migrated files. create new one to ensure your table consistency`,
      })
    );
  });

  it('should success delete not-migrated migration', async () => {
    await expect(
      projectService.deleteProjectMigration(
        context,
        project0ID,
        sampleFilename2
      )
    ).resolves.not.toThrowError();

    const migrations = await projectService.getProjectMigrations(
      context,
      {},
      project0ID
    );

    const deletedMigration = migrations.data.find(
      (mi) => mi.deleted_at !== null
    );
    expect(deletedMigration?.filename).toEqual(sampleFilename2);
  });

  it('should failed delete migrated migration', async () => {
    await expect(
      projectService.deleteProjectMigration(context, project0ID, sampleFilename)
    ).rejects.toThrowError(
      new ProjectMigrationForbiddenException({
        message: 'Project migration already migrated',
        internal_message: `you cannot update already migrated files. create new one to ensure your table consistency`,
      })
    );
  });
});
