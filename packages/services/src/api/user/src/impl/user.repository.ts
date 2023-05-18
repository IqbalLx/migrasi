import { Kysely } from 'kysely';
import { IUserRepository } from '../user.interface';

import { Tables } from '@migrasi/shared/database';
import { User } from '@migrasi/shared/entities';

export class UserRepository implements IUserRepository {
  constructor(private db: Kysely<Tables>) {}

  async getBySessionId(sessionId: string): Promise<User | undefined> {
    const user = await this.db
      .selectFrom('sessions as s')
      .where('s.id', '=', sessionId)
      .leftJoin('users as u', 'u.id', 's.user_id')
      .select([
        'u.id',
        'u.name',
        'u.email',
        'u.password',
        'u.created_at',
        'u.updated_at',
        'u.deleted_at',
      ])
      .executeTakeFirst();

    if (user === undefined || user?.id === null) return undefined;

    return user as User;
  }
}
