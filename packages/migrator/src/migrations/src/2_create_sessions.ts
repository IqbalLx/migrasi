import { Kysely } from 'kysely';
import { addTableDefault, createPrimaryKeyIndex } from '../tableDefault';

const tableName = 'sessions';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('expired_at', 'timestamp', (col) => col.notNull())
    .$call((qb) => addTableDefault(qb))
    .execute();

  await createPrimaryKeyIndex(db, tableName);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute();
}
