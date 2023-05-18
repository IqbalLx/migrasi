import { faker } from '@faker-js/faker';
import { decode } from 'jsonwebtoken';

import { authService } from '@migrasi/services/api/auth';
import { userService } from '.';
import { UserRegister } from '@migrasi/shared/entities';
import { db } from '@migrasi/shared/database';

describe('user domain', () => {
  const user: UserRegister = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.string.sample(8),
  };

  let token: string;

  beforeAll(async () => {
    const cookie = await authService.register(user);

    token = cookie.value;
  });

  afterAll(async () => {
    await db.deleteFrom('users').where('email', '=', user.email).execute();
  });

  it('should return correct user based on token only', async () => {
    const sessionId = (decode(token) as { id: string }).id;
    const userFromSession = await userService.getBySessionId(sessionId);

    expect(userFromSession).toBeDefined();

    expect(userFromSession?.id).toBeTruthy();
    expect(userFromSession?.name).toEqual(user.name);
    expect(userFromSession?.email).toEqual(user.email);
  });

  it('should not return user based on random token', async () => {
    const userFromSession = await userService.getBySessionId(
      faker.string.uuid()
    );

    expect(userFromSession).toBeUndefined();
  });
});
