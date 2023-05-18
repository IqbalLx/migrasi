import { readenv } from '@migrasi/shared/utils';

export class DatabaseConfig {
  static get provider() {
    return readenv('DATABASE_PROVIDER', 'postgres');
  }
  static get connectionString() {
    return readenv('DATABASE_CONN_STRING');
  }
  static get dbName() {
    return readenv('DATABASE_DB_NAME', 'migrasi');
  }
}
