import { Config } from '@migrasi/shared/config';

import {
  Context,
  NewSession,
  UserLogin,
  UserRegister,
  UserToken,
} from '@migrasi/shared/entities';

import { toUnixInSeconds } from '@migrasi/shared/utils';

import {
  GeneratedCookie,
  IAuthRepository,
  IAuthService,
} from '../auth.interface';
import { AuthValidator } from './auth.validator';

import { hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';

import { addDaysToDate } from '@migrasi/shared/utils';

export class AuthService implements IAuthService {
  constructor(
    private config: Config['auth'],
    private authRepo: IAuthRepository,
    private authValidator: AuthValidator
  ) {}

  private async generateCookie(userId: string): Promise<GeneratedCookie> {
    const now = new Date();
    const dateExpire = addDaysToDate(now, this.config.expireInDay);
    const sessionPayload: NewSession = {
      user_id: userId,
      expired_at: toUnixInSeconds(dateExpire),
    };

    await this.authRepo.deleteSessionByUser(userId);
    const sessionId = await this.authRepo.createSession(sessionPayload);

    const tokenPayload: UserToken = { id: sessionId };
    const token = sign(tokenPayload, this.config.secret, {
      issuer: 'migrasi',
      expiresIn: `${this.config.expireInDay}d`,
    });

    const SECONDS_IN_DAY = 24 * 60 * 60;
    return {
      value: token,
      maxAgeInSeconds: this.config.expireInDay * SECONDS_IN_DAY,
      expiresAtInMilliseconds: dateExpire.getTime(),
    };
  }

  async register(userRegister: UserRegister): Promise<GeneratedCookie> {
    await this.authValidator.checkDuplicate(userRegister.email);

    const PASSWORD_SALT = 10;
    const hashedUserPassword = await hash(userRegister.password, PASSWORD_SALT);
    const user = await this.authRepo.create({
      ...userRegister,
      password: hashedUserPassword,
    });

    return this.generateCookie(user.id);
  }

  async login(userLogin: UserLogin): Promise<GeneratedCookie> {
    const user = await this.authValidator.validateByEmail(userLogin.email);

    await this.authValidator.validatePassword(
      userLogin.password,
      user.password
    );

    return this.generateCookie(user.id);
  }

  async authorize(token: string): Promise<Context> {
    const sessionId = this.authValidator.validateToken(
      token,
      this.config.secret
    );

    const context = await this.authValidator.validateSession(sessionId);

    return context;
  }

  logout(sessionId: string): Promise<void> {
    return this.authRepo.deleteSession(sessionId);
  }
}
