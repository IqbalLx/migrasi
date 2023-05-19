import { Kysely } from 'kysely';
import { addTableDefault, createPrimaryKeyIndex } from '../tableDefault';

const tableName = 'project_members';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(tableName)
    .addColumn('project_id', 'uuid', (col) =>
      col.references('projects.id').onDelete('cascade')
    )
    .addColumn('member_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade')
    )
    .$call((qb) => addTableDefault(qb))
    .execute();

  await createPrimaryKeyIndex(db, tableName);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(tableName).execute();
}
