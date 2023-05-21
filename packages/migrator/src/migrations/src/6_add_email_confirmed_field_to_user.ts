import { Kysely } from 'kysely';

const tableName = 'users';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn('email_confirmed', 'boolean', (col) => col.defaultTo(false))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable(tableName).dropColumn('email_confirmed').execute();
}
