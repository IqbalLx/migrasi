import { faker } from '@faker-js/faker';

import { authService } from '@migrasi/services/api/auth';
import { userService } from '.';
import { UserRegister } from '@migrasi/shared/entities';
import { db } from '@migrasi/shared/database';
import { NotFoundException } from '@migrasi/shared/errors';

describe('user domain', () => {
  const user: UserRegister = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.string.sample(8),
  };

  let token: string;

  beforeAll(async () => {
    const cookie = await authService.register(user);

    // manually validating email for authorization
    await db
      .updateTable('users')
      .set({ email_confirmed: true })
      .where('email', '=', user.email)
      .execute();

    token = cookie.value;
  });

  afterAll(async () => {
    await db.deleteFrom('users').where('email', '=', user.email).execute();

    await db.destroy();
  });

  it('should return correct user based on context only', async () => {
    const context = await authService.authorize(token);
    const userFromSession = await userService.getByContext(context);

    expect(userFromSession).toBeDefined();

    expect(userFromSession?.id).toBeTruthy();
    expect(userFromSession?.name).toEqual(user.name);
    expect(userFromSession?.email).toEqual(user.email);
  });

  it('should failed to return user based on random context', async () => {
    expect(
      userService.getByContext({
        id: faker.string.uuid(),
        user_id: faker.string.uuid(),
        is_cli: false,
      })
    ).rejects.toThrow(new NotFoundException({ message: 'user not found' }));
  });
});
