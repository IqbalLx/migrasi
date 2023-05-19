import { Kysely } from 'kysely';
import { addTableDefault, createPrimaryKeyIndex } from '../tableDefault';

const tableName = 'projects';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('slug', 'text', (col) => col.unique().notNull())
    .addColumn('author_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade')
    )
    .$call((qb) => addTableDefault(qb))
    .execute();

  await createPrimaryKeyIndex(db, tableName);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute();
}
