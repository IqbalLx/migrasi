import { Config } from '@migrasi/shared/config';

import {
  NewSession,
  UserLogin,
  UserRegister,
  UserToken,
} from '@migrasi/shared/entities';

import { toUnixInSeconds } from '@migrasi/shared/utils';

import { IAuthRepository, IAuthService } from '../auth.interface';
import { AuthValidator } from './auth.validator';

import { hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';

import { addDaysToDate } from '@migrasi/shared/utils';

export class AuthService implements IAuthService {
  constructor(
    private config: Config,
    private authRepo: IAuthRepository,
    private authValidator: AuthValidator
  ) {}

  private async generateToken(userId: string) {
    const now = new Date();
    const dateExpire = addDaysToDate(now, this.config.auth.expireInDay);
    const sessionPayload: NewSession = {
      user_id: userId,
      expired_at: toUnixInSeconds(dateExpire),
    };

    await this.authRepo.deleteSessionByUser(userId);
    const sessionId = await this.authRepo.createSession(sessionPayload);

    const tokenPayload: UserToken = { id: sessionId };
    const token = sign(tokenPayload, this.config.auth.secret, {
      issuer: 'migrasi',
      expiresIn: `${this.config.auth.expireInDay}d`,
    });

    return token;
  }

  async register(userRegister: UserRegister): Promise<string> {
    await this.authValidator.checkDuplicate(userRegister.email);

    const PASSWORD_SALT = 10;
    const hashedUserPassword = await hash(userRegister.password, PASSWORD_SALT);
    const user = await this.authRepo.create({
      ...userRegister,
      password: hashedUserPassword,
    });

    return this.generateToken(user.id);
  }

  async login(userLogin: UserLogin): Promise<string> {
    const user = await this.authValidator.validateByEmail(userLogin.email);

    await this.authValidator.validatePassword(
      userLogin.password,
      user.password
    );

    return this.generateToken(user.id);
  }

  async authorize(token: string): Promise<UserToken> {
    const sessionId = this.authValidator.validateToken(
      token,
      this.config.auth.secret
    );

    await this.authValidator.validateSession(sessionId);

    return { id: sessionId };
  }

  logout(sessionId: string): Promise<void> {
    return this.authRepo.deleteSession(sessionId);
  }
}
