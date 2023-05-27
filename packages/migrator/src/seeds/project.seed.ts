import { Transaction } from 'kysely';
import { Tables } from '@migrasi/shared/database';

import { faker } from '@faker-js/faker';
import { fakeUserIds } from './user.seed';
import {
  ProjectMember,
  ProjectMigration,
  WithoutTableDefault,
} from '@migrasi/shared/entities';

export const fakeProjectIds = [
  '7dabb4dc-4734-42d7-a44b-d9befbeb54a0',
  '40082706-f506-43bd-9417-7b93c93e031e',
  '13506ae5-bd7e-461b-bc19-6f1ba09f850d',
];

export async function seedProject(trx: Transaction<Tables>) {
  console.debug('Seeding projects ...');

  const existingProjects = await trx
    .selectFrom('projects as p')
    .where('id', 'in', fakeProjectIds)
    .select('id')
    .execute();

  if (existingProjects.length === fakeProjectIds.length) {
    console.debug(`Skipping seeding projects, data exists!`);
    return;
  }

  // projects
  const projects = new Array(fakeProjectIds.length)
    .fill(null)
    .map((_, index) => {
      return {
        id: fakeProjectIds[index],
        name: `Project ${index}`,
        slug: `project-${index}`,
        author_id: fakeUserIds[index],
      };
    });

  // project authors
  const projectAuthors = new Array(fakeProjectIds.length)
    .fill(null)
    .map((_, index) => {
      return {
        project_id: fakeProjectIds[index],
        member_id: fakeUserIds[index],
      };
    });

  // project members and migrations
  const userCount = fakeUserIds.length - 6;
  const projectCount = fakeProjectIds.length;
  const usersPerProject = Math.floor(userCount / projectCount);
  let extraUsers = userCount % projectCount;

  let distributedUsers = 3;
  const projectMembers: WithoutTableDefault<ProjectMember>[] = [];
  const projectMigrations: WithoutTableDefault<ProjectMigration>[] = [];

  for (let i = 0; i < projectCount; i++) {
    const projectUsers = usersPerProject + (extraUsers > 0 ? 1 : 0);
    extraUsers--;

    const currFakeUsers = fakeUserIds.slice(
      distributedUsers,
      Math.min(distributedUsers + projectUsers, userCount)
    );
    currFakeUsers.forEach((fakeUserId) => {
      projectMembers.push({
        project_id: fakeProjectIds[i],
        member_id: fakeUserId,
      });
    });

    for (let countMigration = 0; countMigration < 3; countMigration++) {
      currFakeUsers.forEach((fakeUserId) => {
        projectMigrations.push({
          project_id: fakeProjectIds[i],
          created_by: fakeUserId,
          filename: faker.lorem
            .sentence()
            .split(' ')
            .join('_')
            .toLocaleLowerCase(),
          sequence: projectMigrations.length + 1,
          is_migrated: false,
        });
      });
    }

    distributedUsers += projectUsers;
  }

  await trx.insertInto('projects').values(projects).execute();
  await trx.insertInto('project_members').values(projectAuthors).execute();
  await trx.insertInto('project_members').values(projectMembers).execute();
  await trx
    .insertInto('project_migrations')
    .values(projectMigrations)
    .execute();

  console.info(`Successfully seeding projects!`);
}
