import { UserDPO, UserMapper } from '@migrasi/shared/entities';
import { IUserRepository, IUserService } from '../user.interface';

export class UserService implements IUserService {
  constructor(private userRepo: IUserRepository) {}

  async getBySessionId(sessionId: string): Promise<UserDPO | undefined> {
    const user = await this.userRepo.getBySessionId(sessionId);

    if (user === undefined) return;

    return UserMapper.convertToDPO(user);
  }
}
