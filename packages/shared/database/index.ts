import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Tables } from './tables.interface';
import { Config } from '@migrasi/shared/config';

export * from './tables.interface';

export const db = new Kysely<Tables>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: Config.database.connectionString,
      database: Config.database.dbName,
    }),
  }),
});
