import { User, UserDPO } from '@migrasi/shared/entities';

export interface IUserService {
  getBySessionId(sessionId: string): Promise<UserDPO | undefined>;
}

export interface IUserRepository {
  getBySessionId(sessionId: string): Promise<User | undefined>;
}
