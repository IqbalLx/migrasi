import { type CreateTableBuilder, sql, Kysely } from 'kysely';

export function addTableDefault<T extends string>(
  builder: CreateTableBuilder<T, never>
) {
  return builder
    .addColumn('id', 'uuid', (col) =>
      col.defaultTo(sql`gen_random_uuid()`).primaryKey()
    )
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`NOW()`))
    .addColumn('deleted_at', 'timestamp');
}

export function createPrimaryKeyIndex(db: Kysely<unknown>, tableName: string) {
  return db.schema
    .createIndex(`idx_${tableName}_id`)
    .on(tableName)
    .columns(['id'])
    .execute();
}
