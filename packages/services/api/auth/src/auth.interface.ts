import {
  Context,
  NewSession,
  Session,
  User,
  UserLogin,
  UserRegister,
} from '@migrasi/shared/entities';

export type GeneratedCookie = {
  value: string;
  maxAgeInSeconds: number;
  expiresAtInMilliseconds: number;
};

export interface IAuthService {
  register(user: UserRegister): Promise<GeneratedCookie>;
  login(user: UserLogin): Promise<GeneratedCookie>;
  cliLogin(user: UserLogin): Promise<GeneratedCookie>;
  authorize(token: string): Promise<Context>;
  cliAuthorize(token: string): Promise<Context>;
  confirmEmail(token: string): Promise<void>;
  logout(sessionId: string): Promise<void>;
  cliLogout(sessionId: string): Promise<void>;
}

export interface IAuthRepository {
  create(user: UserRegister): Promise<User>;
  createSession(session: NewSession): Promise<Session['id']>;
  checkExistsByEmail(email: string): Promise<boolean>;
  getSession(sessionId: string): Promise<Context | undefined>;
  getByEmail(email: string): Promise<User | undefined>;
  getUserEmailConfirmationStatus(userId: string): Promise<boolean>;
  getById(id: string): Promise<User | undefined>;
  updateEmailConfirmationStatus(id: string, status: boolean): Promise<void>;
  deleteSession(sessionId: string, isCli: boolean): Promise<void>;
  deleteSessionByUser(userId: string, isCli: boolean): Promise<void>;
}
