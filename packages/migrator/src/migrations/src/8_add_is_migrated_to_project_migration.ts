import { Kysely } from 'kysely';

const tableName = 'project_migrations';
const projectMigrationUnique = 'project_id_filename_unique_constraint';
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .addColumn('is_migrated', 'boolean', (col) => col.defaultTo(false))
    .execute();

  await db.schema
    .alterTable(tableName)
    .addUniqueConstraint(projectMigrationUnique, ['project_id', 'filename'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(tableName)
    .dropConstraint(projectMigrationUnique)
    .execute();

  await db.schema.alterTable(tableName).dropColumn('is_migrated').execute();
}
