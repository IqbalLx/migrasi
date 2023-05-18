import { Kysely } from 'kysely';
import { addTableDefault, createPrimaryKeyIndex } from '../tableDefault';

const tableName = 'users';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('password', 'text', (col) => col.notNull())
    .$call((qb) => addTableDefault(qb))
    .execute();

  await createPrimaryKeyIndex(db, tableName);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute();
}
