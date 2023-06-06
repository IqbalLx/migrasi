import { Context, User, UserDPO } from '@migrasi/shared/entities';

export interface IUserService {
  getByContext(context: Context): Promise<UserDPO | undefined>;
  getById(userId: string): Promise<UserDPO | undefined>;
}

export interface IUserRepository {
  getById(userId: string): Promise<User | undefined>;
}
