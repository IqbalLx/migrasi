import { LoadWithMessage, TRPC } from '@migrasi/shared/trpc/clients/cli';
import { Command } from 'typed-cmdargs';
import { CLIConfig, Config } from '@migrasi/services/cli/config';
import { readdir, unlink } from 'fs/promises';
import inquirer from 'inquirer';
import { join } from 'path';
import { checkFileExists } from '@migrasi/shared/utils';
import { bgGreen } from 'chalk';

export class Delete implements Command {
  private config!: Config;
  constructor(
    private trpc: TRPC,
    private cliConfig: CLIConfig,
    private params: {
      yes: boolean;
    }
  ) {}

  @LoadWithMessage('Fetching local migrations ...')
  private async loadLocalMigrations() {
    const localMigrations = await readdir(this.config.migration_folder);
    localMigrations.sort();

    return localMigrations;
  }

  private formatMigrationChoices(localMigrations: string[]) {
    const choices = localMigrations.map((localMigration) => {
      return {
        name: localMigration.split('.')[0],
        value: localMigration,
      };
    });

    return choices;
  }

  private async askMigrationFilename(localMigrations: string[]) {
    const answer = await inquirer.prompt<{ filename: string }>({
      type: 'list',
      name: 'filename',
      message: 'Select migration you wish to delete',
      choices: this.formatMigrationChoices(localMigrations),
    });

    return this.validateAndReturnFilename(answer.filename);
  }

  private async validateAndReturnFilename(value: string) {
    const fullPath = join(this.config.migration_folder, value);
    const isExists = await checkFileExists(fullPath);
    if (!isExists) {
      console.log('migration not found!');
      process.exit(1);
    }

    return value;
  }

  private extractFilenameOnly(migrationPath: string) {
    return migrationPath.split('_').splice(1).join('_').split('.')[0];
  }

  @LoadWithMessage('Deleting migration ...')
  private async delete(filename: string) {
    await this.trpc.project.deleteMigration.mutate({
      projectSlugOrId: this.config.project.id,
      filename: this.extractFilenameOnly(filename),
    });

    await unlink(join(this.config.migration_folder, filename));
  }

  private async askConfirmation(filename: string) {
    const filenameOnly = this.extractFilenameOnly(filename);
    const answer = await inquirer.prompt<{ confirm: boolean }>({
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure to delete ${filenameOnly}?`,
    });

    return answer.confirm;
  }

  async execute(): Promise<void> {
    this.config = await this.cliConfig.readConfig();

    const localMigrations = await this.loadLocalMigrations();
    const selectedFilename = await this.askMigrationFilename(localMigrations);

    if (!this.params.yes) {
      const confirmed = await this.askConfirmation(selectedFilename);
      if (!confirmed) {
        console.log('Deletion cancelled');
        process.exit(0);
      }
    }

    await this.delete(selectedFilename);

    console.log(bgGreen('Success delete migration'));
    process.exit(0);
  }
}
