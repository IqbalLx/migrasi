import { Kysely, sql } from 'kysely';
import { Tables } from '@migrasi/shared/database';

import { IAuthRepository } from '../auth.interface';
import {
  UserRegister,
  User,
  NewSession,
  Session,
  Context,
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
        ...session,
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

  getSession(sessionId: string): Promise<Context | undefined> {
    return this.db
      .selectFrom('sessions')
      .where('id', '=', sessionId)
      .where('expired_at', '>', sql`NOW()`)
      .select(['sessions.id', 'sessions.user_id', 'sessions.is_cli'])
      .executeTakeFirst();
  }

  getByEmail(email: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();
  }

  async getUserEmailConfirmationStatus(userId: string): Promise<boolean> {
    const user = await this.db
      .selectFrom('users')
      .where('id', '=', userId)
      .select('email_confirmed')
      .executeTakeFirst();

    if (user === undefined) return false;

    return user.email_confirmed;
  }

  getById(id: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .where('id', '=', id)
      .selectAll()
      .executeTakeFirst();
  }

  async deleteSession(sessionId: string, isCLI: boolean): Promise<void> {
    await this.db
      .deleteFrom('sessions')
      .where('id', '=', sessionId)
      .where('is_cli', '=', isCLI)
      .execute();
    return;
  }

  async deleteSessionByUser(userId: string, isCLI: boolean): Promise<void> {
    await this.db
      .deleteFrom('sessions')
      .where('user_id', '=', userId)
      .where('is_cli', '=', isCLI)
      .execute();
  }

  async updateEmailConfirmationStatus(
    id: string,
    status: boolean
  ): Promise<void> {
    await this.db
      .updateTable('users')
      .set({ email_confirmed: status, updated_at: sql`now()` })
      .where('id', '=', id)
      .execute();

    return;
  }
}
