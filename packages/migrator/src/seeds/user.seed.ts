import { Transaction } from 'kysely';
import { Tables } from '@migrasi/shared/database';

import { faker } from '@faker-js/faker';

import { hash } from 'bcryptjs';

export const fakeUserIds = [
  '20e81ec4-477e-4047-900d-355c49e53932',
  'ab99dc39-650e-46f6-8d8e-f8a39c447e73',
  '883986d2-7222-4c55-91f1-6baa2860dd6d',
  '5a5de46a-1a26-4cf2-984a-04e1c8c1ddc4',
  '4973cf4e-8d8d-44fe-bded-875ec459ab64',
  'c7c75d7f-6d3a-4ba6-89f6-bee4bf8cfd60',
  '2503f95a-3f88-4885-993e-201c573caed8',
  '50df1e66-a8a3-42ac-b72f-d4d44d32d80c',
  '46bac1f6-8d23-4011-9e93-7b5deff04cfd',
  '76127361-72ae-4db9-b38d-13fedb1aee3e',
  '14064005-c1b4-439d-98f6-d2d70e6dee58',
  '76c9fa33-7eba-44cb-9fcb-0d4e5a355469',
  '4f1beb41-008d-4f58-851f-677b147cdd13',
  '1a82d400-5c19-46ef-83ae-0a6dab7183a0',
  'cb542df8-7cbf-4ca3-b22e-984ad771e699',
];
export async function seedUser(trx: Transaction<Tables>) {
  console.debug('Seeding users ...');

  const existingUser = await trx
    .selectFrom('users as u')
    .where('id', 'in', fakeUserIds)
    .select('id')
    .execute();

  if (existingUser.length === fakeUserIds.length) {
    console.debug(`Skipping seeding users, data exists!`);
    return;
  }

  const hashedPassword = await hash('Password123654', 10);
  const fakeUsers = fakeUserIds.map((fakeId, index) => {
    return {
      id: fakeId,
      name: faker.person.fullName(),
      email: `user${index}@email.com`,
      password: hashedPassword,
      email_confirmed: index < fakeUserIds.length - 3,
    };
  });

  await trx.insertInto('users').values(fakeUsers).execute();
  console.debug(`Successfully seeding users!`);
}
