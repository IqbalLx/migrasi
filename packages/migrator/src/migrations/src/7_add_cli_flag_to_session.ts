import { Kysely } from 'kysely';

const tableName = 'sessions';
const userCliUniqueConstraint = 'user_id_and_is_cli_unique';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn('is_cli', 'boolean', (col) => col.defaultTo(false))
    .execute();

  await db.schema
    .alterTable(tableName)
    .addUniqueConstraint(userCliUniqueConstraint, ['user_id', 'is_cli']) // mark user can only have 2 active sessions, one for web, one for cli
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .dropConstraint(userCliUniqueConstraint)
    .execute();

  await db.schema.alterTable(tableName).dropColumn('is_cli').execute();
}
