import { Command } from 'typed-cmdargs';
import { LoadWithMessage, type TRPC } from '@migrasi/shared/trpc/clients/cli';
import { CLIConfig, Config } from '@migrasi/services/cli/config';
import { open } from 'fs/promises';
import { join } from 'path';
import { bgGreen, bgRed, inverse } from 'chalk';

export class Create implements Command {
  private config!: Config;

  constructor(
    private trpc: TRPC,
    private cliConfig: CLIConfig,
    private filename: string
  ) {}

  @LoadWithMessage('Creating new migration ... ')
  private async createMigration() {
    const generatedFilename = await this.trpc.project.createMigration.mutate({
      filename: this.filename,
      projectOrSlugId: this.config.project.id,
    });

    return generatedFilename;
  }

  async execute(): Promise<void> {
    this.config = await this.cliConfig.readConfig();

    const generatedFilename = await this.createMigration();
    const generatedFilenameWithExt = `${generatedFilename}.ts`;
    const newMigrationPath = join(
      this.config.migration_folder,
      generatedFilenameWithExt
    );
    await open(newMigrationPath, 'w');

    console.log(bgGreen('New migration created!'));

    process.exit(0);
  }
}
