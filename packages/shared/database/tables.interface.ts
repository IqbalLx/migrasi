import type {
  ProjectMemberTable,
  ProjectMigrationTable,
  ProjectTable,
  SessionTable,
  UserTable,
} from '@migrasi/shared/entities';

export interface Tables {
  users: UserTable;
  sessions: SessionTable;
  projects: ProjectTable;
  project_members: ProjectMemberTable;
  project_migrations: ProjectMigrationTable;
  kysely_migration: {
    name: string;
    timestamp: string;
  };
}
