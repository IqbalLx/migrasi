import { UserRegister } from '@migrasi/shared/entities';
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
    const cookie = await authService.register(user);

    expect(cookie).toBeTruthy();

    generatedToken = cookie.value;
  });

  it('should failed registering user with same email', async () => {
    expect(authService.register(user)).rejects.toThrow(
      new ForbiddenException({ message: 'auth failed' })
    );
  });

  it('should failed authorizing token without confirming email', () => {
    expect(authService.authorize(generatedToken)).rejects.toThrowError(
      new UnauthorizedException({ message: 'confirm your email first' })
    );
  });

  it('should failed login without confirming email', async () => {
    expect(
      authService.login({
        email: user.email,
        password: user.password,
      })
    ).rejects.toThrow(
      new ForbiddenException({ message: 'confirm your email first' })
    );

    await db
      .updateTable('users')
      .set({ email_confirmed: true })
      .where('email', '=', user.email)
      .execute();
  });

  it('should success login with registered user after email confirmed', async () => {
    const cookie = await authService.login({
      email: user.email,
      password: user.password,
    });

    expect(cookie).toBeTruthy();

    generatedToken = cookie.value;
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
    const session = await authService.authorize(generatedToken);

    expect(session.id).toBeTruthy();
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
