import { User, UserRegister } from '@migrasi/shared/entities';
import { db } from '@migrasi/shared/database';

import { authService } from '.';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@migrasi/shared/errors';

describe('auth domain', () => {
  const user: UserRegister = {
    name: 'Iqbal Maulana',
    email: 'iqbal@mbts.dev',
    password: 'password123',
  };

  const tamperedToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhkZmRlMGZkLWU0YWMtNGVhOC04Y2I3LWQzNTBhNzUzZDI4MyIsImlhdCI6MTY4NDM5MDc0OSwiZXhwIjoxNjg2OTgyNzQ5LCJpc3MiOiJtaWdyYXNpIn0.bL_qCt4ktSt3usBmkBwdbQ-b0jZAXJZ_zAXffEOvomI';
  let generatedToken: string;

  afterAll(async () => {
    await db.deleteFrom('users').where('email', '=', user.email).execute();
  });

  it('should success register user', async () => {
    const token = await authService.register(user);

    expect(token).toBeTruthy();
  });

  it('should failed registering user with same email', async () => {
    expect(authService.register(user)).rejects.toThrow(
      new ForbiddenException({ message: 'auth failed' })
    );
  });

  it('should success login with registered user', async () => {
    const token = await authService.login({
      email: user.email,
      password: user.password,
    });

    expect(token).toBeTruthy();

    generatedToken = token;
  });

  it('should failed to login with wrong credentials', async () => {
    expect(
      authService.login({
        email: 'iqbal@mail.com',
        password: user.password,
      })
    ).rejects.toThrow(new ForbiddenException({ message: 'auth failed' }));
  });

  it('should success authorizing valid token', async () => {
    const sessionId = await authService.authorize(generatedToken);

    expect(sessionId.id).toBeTruthy();
  });

  it('should failed authorizing tampered token', () => {
    expect(authService.authorize(tamperedToken)).rejects.toThrowError(
      new UnauthorizedException({ message: 'auth failed' })
    );
  });

  it('should success logout user', async () => {
    const sessionId = await authService.authorize(generatedToken);
    await authService.logout(sessionId.id);

    expect(authService.authorize(tamperedToken)).rejects.toThrowError(
      new UnauthorizedException({ message: 'auth failed' })
    );
  });
});
