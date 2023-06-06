import { Config } from '@migrasi/shared/config';

import {
  Context,
  NewSession,
  UserLogin,
  UserRegister,
  UserToken,
} from '@migrasi/shared/entities';

import { type EmailBridge } from '@migrasi/shared/bridges/email';

import { Debug, toUnixInSeconds } from '@migrasi/shared/utils';

import {
  GeneratedCookie,
  IAuthRepository,
  IAuthService,
} from '../auth.interface';
import { AuthValidator } from './auth.validator';

import * as bcrypt from 'bcryptjs';
const { hash } = bcrypt;
import * as jwt from 'jsonwebtoken';
const { sign } = jwt;

import { addDaysToDate } from '@migrasi/shared/utils';

export class AuthService implements IAuthService {
  constructor(
    private config: Config['auth'],
    private system: Config['system'],
    private authRepo: IAuthRepository,
    private authValidator: AuthValidator,
    private emailBridge: EmailBridge
  ) {}

  private async generateCookie(
    userId: string,
    isCLI = false
  ): Promise<GeneratedCookie> {
    const EXPIRE_IN_DAY = isCLI
      ? this.config.cliExpireInDay
      : this.config.expireInDay;
    const SECRET = isCLI ? this.config.cliSecret : this.config.secret;
    const SECONDS_IN_DAY = 24 * 60 * 60;

    const now = new Date();
    const dateExpire = addDaysToDate(now, EXPIRE_IN_DAY);
    const sessionPayload: NewSession = {
      user_id: userId,
      expired_at: toUnixInSeconds(dateExpire),
      is_cli: isCLI,
    };

    await this.authRepo.deleteSessionByUser(userId, isCLI);
    const sessionId = await this.authRepo.createSession(sessionPayload);

    const tokenPayload: UserToken = { id: sessionId };
    const token = sign(tokenPayload, SECRET, {
      issuer: 'migrasi',
      expiresIn: `${this.config.expireInDay}d`,
    });

    return {
      value: token,
      maxAgeInSeconds: EXPIRE_IN_DAY * SECONDS_IN_DAY,
      expiresAtInMilliseconds: dateExpire.getTime(),
    };
  }

  private async generateEmailConfirmationToken(
    userId: string
  ): Promise<string> {
    const tokenPayload = { id: userId };
    const token = sign(tokenPayload, this.config.emailConfirmationSecret, {
      issuer: 'migrasi',
      expiresIn: `${this.config.emailConfirmationExpireInDay}d`,
    });

    return token;
  }

  async register(userRegister: UserRegister): Promise<GeneratedCookie> {
    await this.authValidator.checkDuplicate(userRegister.email);

    const PASSWORD_SALT = 10;
    const hashedUserPassword = await hash(userRegister.password, PASSWORD_SALT);
    const user = await this.authRepo.create({
      ...userRegister,
      password: hashedUserPassword,
    });

    const emailConfirmationToken = await this.generateEmailConfirmationToken(
      user.id
    );
    const emailConfirmationLink = `${this.system.baseUrl}/auth/confirm-email/${emailConfirmationToken}`;

    this.emailBridge.emit('send', user.email, {
      subject: 'Confirm Your Migrasi Account',
      html: `
        <h1>Welcome to Migrasi!</h1>
        </br>
        We are glad you joined us, but first please confirm you are not a robot by opening this <a href="${emailConfirmationLink}" target="_blank">link</a> </br>
        or if you are concern of phising feel free to inspect this raw link <a href="${emailConfirmationLink}" target="_blank">${emailConfirmationLink}</a> and paste to your browser. </br>
        Heads up! <important>This link will expired in 1 day </important>, after the link expired you can't continue using your email. I just too lazy to implement secure resend-email logic`,
      priority: 'high',
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

  @Debug
  async cliLogin(userLogin: UserLogin): Promise<GeneratedCookie> {
    const user = await this.authValidator.validateByEmail(userLogin.email);

    await this.authValidator.validatePassword(
      userLogin.password,
      user.password
    );

    return this.generateCookie(user.id, true);
  }

  async authorize(token: string): Promise<Context> {
    const sessionId = this.authValidator.validateToken(
      token,
      this.config.secret
    );

    const context = await this.authValidator.validateSession(sessionId, false);

    return context;
  }

  async cliAuthorize(token: string): Promise<Context> {
    const sessionId = this.authValidator.validateToken(
      token,
      this.config.cliSecret
    );

    const context = await this.authValidator.validateSession(sessionId, true);

    return context;
  }

  async confirmEmail(token: string): Promise<void> {
    const userId = this.authValidator.validateToken(
      token,
      this.config.emailConfirmationSecret
    );

    await this.authValidator.validateById(userId);

    return this.authRepo.updateEmailConfirmationStatus(userId, true);
  }

  logout(sessionId: string): Promise<void> {
    return this.authRepo.deleteSession(sessionId, false);
  }

  cliLogout(sessionId: string): Promise<void> {
    return this.authRepo.deleteSession(sessionId, true);
  }
}
