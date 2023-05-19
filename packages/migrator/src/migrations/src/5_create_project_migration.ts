import { Kysely } from 'kysely';
import { addTableDefault, createPrimaryKeyIndex } from '../tableDefault';

const tableName = 'project_migrations';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn('project_id', 'uuid', (col) =>
      col.references('projects.id').onDelete('cascade')
    )
    .addColumn('created_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('filename', 'text', (col) => col.notNull())
    .addColumn('sequence', 'integer', (col) => col.notNull())
    .$call((qb) => addTableDefault(qb))
    .execute();

  await createPrimaryKeyIndex(db, tableName);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute();
}
