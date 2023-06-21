import { Command } from 'typed-cmdargs';
import { LoadWithMessage, TRPC } from '@migrasi/shared/trpc/clients/cli';
import { CLIConfig, Config } from '@migrasi/services/cli/config';
import { readdir } from 'fs/promises';
import { bgGreen, bgRed, inverse } from 'chalk';

export class Check implements Command {
  private config!: Config;

  constructor(
    private trpc: TRPC,
    private cliConfig: CLIConfig,
    private params: {
      validate: boolean;
    }
  ) {}

  @LoadWithMessage('Fetching your remote migrations ...')
  private async loadAllRemoteMigrations() {
    const remoteMigrations =
      await this.trpc.project.getAllProjectMigrations.query({
        projectIdOrSlug: this.config.project.id,
      });

    return remoteMigrations;
  }

  @LoadWithMessage('Fetching your local migrations ...')
  private async loadAllLocalMigrations() {
    const localMigrations = await readdir(this.config.migration_folder);
    return localMigrations;
  }

  private compare(localMigrations: string[], remoteMigrations: string[]) {
    const onlyOnLocal = localMigrations.filter(
      (migration) => !remoteMigrations.includes(migration)
    );
    const onlyOnRemote = remoteMigrations.filter(
      (migration) => !localMigrations.includes(migration)
    );

    return {
      onlyOnLocal,
      onlyOnRemote,
    };
  }

  async execute(): Promise<void> {
    this.config = await this.cliConfig.readConfig();

    const [remoteMigrations, localMigrations] = await Promise.all([
      this.loadAllRemoteMigrations(),
      this.loadAllLocalMigrations(),
    ]);
    const filenameOnlyRemoteMigrations = remoteMigrations.map(
      (remoteMigration) =>
        `${remoteMigration.sequence}_${remoteMigration.filename}.ts`
    );
    const diff = this.compare(localMigrations, filenameOnlyRemoteMigrations);
    const isDiff = diff.onlyOnLocal.length > 0 || diff.onlyOnRemote.length > 0;

    if (!isDiff) {
      console.log(bgGreen('You are up to date!'));
    } else {
      if (this.params.validate) console.log(bgRed('Error found'));

      if (diff.onlyOnLocal.length > 0) {
        console.log(
          `You have this local migration that is not synced to remote. Run ${inverse(
            'migrasi sync'
          )} to sync following migrations:`
        );
        diff.onlyOnLocal.forEach((migration) => console.log(`  ${migration}`));
        console.log('\n');
      }

      if (diff.onlyOnLocal.length > 0) {
        console.log(
          'You have this remote migration that is not synced to your local. Make sure you pull latest changes from git to get following migrations:'
        );
        diff.onlyOnRemote.forEach((migration) => console.log(`  ${migration}`));
      }
    }

    if (this.params.validate && isDiff) {
      process.exit(1);
    }

    process.exit(0);
  }
}
