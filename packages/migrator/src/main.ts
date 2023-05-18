import { FileMigrationProvider, Migrator } from 'kysely';

import { promises as fs } from 'fs';
import * as path from 'path';

import { db } from '@migrasi/shared/database';

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, 'migrations/src'),
  }),
});

export async function migrateToLatest() {
  const { error, results } = await migrator.migrateToLatest();

  if (results?.length !== 0) {
    results?.forEach((it) => {
      if (it.status === 'Success') {
        console.log(
          `migration "${it.migrationName}" was executed successfully`
        );
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`);
      }
    });
  } else {
    console.log('nothing to migrate');
  }

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  console.log('Migration completed! Exiting...');
  await db.destroy();
}

export async function rollbackAll() {
  const migrations = await db
    .selectFrom('kysely_migration')
    .selectAll('kysely_migration')
    .execute();

  for (let i = 0; i <= migrations.length; i++) {
    const { error, results } = await migrator.migrateDown();
    if (results?.length !== 0) {
      results?.forEach((it) => {
        if (it.status === 'Success') {
          console.log(
            `rollback "${it.migrationName}" was executed successfully`
          );
        } else if (it.status === 'Error') {
          console.error(`failed to execute rollback "${it.migrationName}"`);
        }
      });
    } else {
      console.log('nothing to rollback');
    }

    if (error) {
      console.error('failed to rollback');
      console.error(error);
      process.exit(1);
    }
  }

  console.log('Rollback completed! Exiting...');
  await db.destroy();
}

async function main() {
  const args = process.argv.splice(2);
  switch (args[0]) {
    case 'latest':
      migrateToLatest();
      break;
    case 'rollback':
      rollbackAll();
      break;
    default:
      console.log('Not yet implemented');
  }
}

main();
