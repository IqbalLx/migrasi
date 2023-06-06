import { Kysely } from 'kysely';
import { IUserRepository } from '../user.interface';

import { Tables } from '@migrasi/shared/database';
import { User } from '@migrasi/shared/entities';

export class UserRepository implements IUserRepository {
  constructor(private db: Kysely<Tables>) {}

  getById(userId: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users as u')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();
  }
}
