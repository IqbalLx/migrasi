import type { SessionTable, UserTable } from '@migrasi/shared/entities';

export interface Tables {
  users: UserTable;
  sessions: SessionTable;
  kysely_migration: {
    name: string;
    timestamp: string;
  };
}
