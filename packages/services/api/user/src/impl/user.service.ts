import { Context, UserDPO, UserMapper } from '@migrasi/shared/entities';
import { NotFoundException } from '@migrasi/shared/errors';
import { IUserRepository, IUserService } from '../user.interface';

export class UserService implements IUserService {
  constructor(private userRepo: IUserRepository) {}

  getByContext(context: Context): Promise<UserDPO | undefined> {
    return this.getById(context.user_id);
  }

  async getById(userId: string): Promise<UserDPO | undefined> {
    const user = await this.userRepo.getById(userId);

    if (user === undefined)
      throw new NotFoundException({ message: 'user not found' });

    return UserMapper.convertToDPO(user, true);
  }
}
