import { Kysely, sql } from 'kysely';
import { Tables } from '@migrasi/shared/database';

import { IAuthRepository } from '../auth.interface';
import {
  UserRegister,
  User,
  NewSession,
  Session,
} from '@migrasi/shared/entities';

export class AuthRepository implements IAuthRepository {
  constructor(private db: Kysely<Tables>) {}

  create(user: UserRegister): Promise<User> {
    return this.db
      .insertInto('users')
      .values(user)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async createSession(session: NewSession): Promise<Session['id']> {
    const createdSession = await this.db
      .insertInto('sessions')
      .values({
        user_id: session.user_id,
        expired_at: sql`to_timestamp(${session.expired_at})`,
      })
      .returning('id')
      .executeTakeFirstOrThrow();

    return createdSession.id;
  }

  async checkExistsByEmail(email: string): Promise<boolean> {
    const user = await this.db
      .selectFrom('users')
      .where('email', '=', email)
      .select(sql<string>`coalesce(count(id), 0)`.as('count'))
      .executeTakeFirst();

    return Number(user?.count) > 0;
  }

  async checkSessionExists(sessionId: string): Promise<boolean> {
    const session = await this.db
      .selectFrom('sessions')
      .where('id', '=', sessionId)
      .where('expired_at', '>', sql`NOW()`)
      .select(sql<string>`coalesce(count(id), 0)`.as('count'))
      .executeTakeFirst();

    console.debug({ session });

    return Number(session?.count) > 0;
  }

  getByEmail(email: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  getById(id: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id', '=', sessionId).execute();
    return;
  }

  async deleteSessionByUser(userId: string): Promise<void> {
    await this.db
      .deleteFrom('sessions')
      .where('user_id', '=', userId)
      .execute();
  }
}
