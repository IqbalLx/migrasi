import {
  NewSession,
  Session,
  User,
  UserLogin,
  UserRegister,
  UserToken,
} from '@migrasi/shared/entities';

export interface IAuthService {
  register(user: UserRegister): Promise<string>;
  login(user: UserLogin): Promise<string>;
  authorize(token: string): Promise<UserToken>;
  logout(sessionId: string): Promise<void>;
}

export interface IAuthRepository {
  create(user: UserRegister): Promise<User>;
  createSession(session: NewSession): Promise<Session['id']>;
  checkExistsByEmail(email: string): Promise<boolean>;
  checkSessionExists(sessionId: string): Promise<boolean>;
  getByEmail(email: string): Promise<User | undefined>;
  getById(id: string): Promise<User | undefined>;
  getBySession(sessionId: string): Promise<User | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  deleteSessionByUser(userId: string): Promise<void>;
}
