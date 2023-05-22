import { authService } from '@migrasi/services/api/auth';
import { Context, NewProject, ProjectDPO } from '@migrasi/shared/entities';

import { projectService } from '.';
import { getDB } from '@migrasi/shared/database';
import { ProjectNotFoundException } from './impl/project.error';

describe('Project Domain', () => {
  const db = getDB();

  let context: Context;
  let contextUser5: Context;

  let slug: string;

  beforeAll(async () => {
    const [cookieUser1, cookieUser5] = await Promise.all([
      authService.login({
        email: 'user0@email.com',
        password: 'Password123654',
      }),
      authService.login({
        email: 'user5@email.com',
        password: 'Password123654',
      }),
    ]);

    [context, contextUser5] = await Promise.all([
      authService.authorize(cookieUser1.value),
      authService.authorize(cookieUser5.value),
    ]);

    const newProject: NewProject = {
      name: 'Project Jest For Test',
    };

    const forTestProject = await projectService.createProject(
      context,
      newProject
    );

    slug = forTestProject.slug;
  });

  afterAll(async () => {
    await authService.logout(context.id);
    await authService.logout(contextUser5.id);

    await db
      .deleteFrom('projects')
      .where('slug', 'ilike', `project-jest-%`)
      .execute();

    await db.destroy();
  });

  it('should success create new project', async () => {
    const newProject: NewProject = {
      name: 'Project Jest',
    };

    const createdProject = await projectService.createProject(
      context,
      newProject
    );

    expect(createdProject.slug.startsWith('project-jest-')).toBe(true);
  });

  it('should success create another project with same name', async () => {
    const newProject: NewProject = {
      name: 'Project Jest',
    };

    await expect(
      projectService.createProject(context, newProject)
    ).resolves.not.toThrowError();
  });

  it('should success get detail of project -- author test', async () => {
    const project = await projectService.getProjectDetail(context, slug);

    expect(project).toMatchObject({
      id: expect.any(String),
      created_at: expect.any(Number),
      updated_at: expect.any(Number),
      deleted_at: null,
      name: 'Project Jest For Test',
      author: {
        id: expect.any(String),
        name: expect.any(String),
        email: 'user0@email.com',
      },
    });
  });

  it('should success get detail project where theyre member -- member test', async () => {
    const project = await projectService.getProjectDetail(
      contextUser5,
      'project-0'
    );

    expect(project).toMatchObject({
      id: expect.any(String),
      created_at: expect.any(Number),
      updated_at: expect.any(Number),
      deleted_at: null,
      name: 'Project 0',
      author: {
        id: expect.any(String),
        name: expect.any(String),
        email: 'user0@email.com',
      },
    });
  });

  it('should return correct DPO schema', async () => {
    const project = await projectService.getProjectDetail(context, 'project-0'); // from seeder

    const validation = ProjectDPO.safeParse(project);
    expect(validation.success).toBe(true);
  });

  it('should failed get detail of project where theyre not part of', async () => {
    await expect(
      projectService.getProjectDetail(contextUser5, slug)
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${contextUser5.user_id} not a member of project with slug ${slug}`,
        },
        'NOTMEMBER'
      )
    );
  });

  it('should successfully delete project', async () => {
    const project = await db
      .selectFrom('projects')
      .select('id')
      .where('slug', '=', slug)
      .orderBy('created_at', 'desc')
      .executeTakeFirstOrThrow();

    await expect(
      projectService.deleteProject(context, project.id)
    ).resolves.not.toThrowError();
  });

  it('should failed to delete project that not authored by them', async () => {
    const project = await db
      .selectFrom('projects')
      .select('id')
      .where('slug', '=', 'project-2')
      .orderBy('created_at', 'desc')
      .executeTakeFirstOrThrow();

    await expect(
      projectService.deleteProject(context, project.id)
    ).rejects.toThrowError(
      new ProjectNotFoundException(
        {
          message: 'Project cannot be found',
          internal_message: `user with id ${context.user_id} not an author of project with slug ${project.id}`,
        },
        'NOTAUTHOR'
      )
    );
  });
});
