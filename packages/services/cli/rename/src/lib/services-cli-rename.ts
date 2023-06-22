import { LoadWithMessage, TRPC } from '@migrasi/shared/trpc/clients/cli';
import { CLIConfig, Config } from '@migrasi/services/cli/config';
import { Command } from 'typed-cmdargs';
import { readdir, rename } from 'fs/promises';
import inquirer from 'inquirer';
import { join } from 'path';
import { bgGreen } from 'chalk';
import { checkFileExists } from '@migrasi/shared/utils';

interface FilenameFlagHelper {
  getFilename(): Promise<string>;
}

export class CurrentFilenameFlag implements FilenameFlagHelper {
  private config!: Config;

  constructor(
    private cliConfig: CLIConfig,
    private value: string | undefined
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

  private async askCurrentMigration(localMigrations: string[]) {
    const answer = await inquirer.prompt<{ filename: string }>({
      type: 'list',
      name: 'filename',
      message: 'Select migration you wish to rename',
      choices: this.formatMigrationChoices(localMigrations),
    });

    return answer.filename;
  }

  private async validateAndReturnFilename(value: string) {
    const fullPath = join(this.config.migration_folder, value);
    const isExists = await checkFileExists(fullPath);
    if (!isExists) {
      console.log('Source migration not found!');
      process.exit(1);
    }

    return value;
  }

  async getFilename(): Promise<string> {
    this.config = await this.cliConfig.readConfig();

    if (this.value !== undefined)
      return this.validateAndReturnFilename(this.value);

    const localMigrations = await this.loadLocalMigrations();
    const value = await this.askCurrentMigration(localMigrations);

    return this.validateAndReturnFilename(value);
  }
}

export class UpdateFilenameFlag implements FilenameFlagHelper {
  constructor(private value: string | undefined) {}

  private async askUpdatedMigration() {
    const answer = await inquirer.prompt<{ filename: string }>({
      type: 'input',
      name: 'filename',
      message: 'Write your updated name',
    });

    return answer.filename;
  }

  private standardize(value: string) {
    return value.toLocaleLowerCase().split(' ').join('_');
  }

  async getFilename(): Promise<string> {
    if (this.value !== undefined) return this.standardize(this.value);

    const value = await this.askUpdatedMigration();
    return this.standardize(value);
  }
}

export class Rename implements Command {
  private config!: Config;
  constructor(
    private trpc: TRPC,
    private cliConfig: CLIConfig,
    private params: {
      from: CurrentFilenameFlag;
      to: UpdateFilenameFlag;
    }
  ) {}

  private extractFilenameOnly(migrationPath: string) {
    return migrationPath.split('_').splice(1).join('_').split('.')[0];
  }

  private constructUpdatedFilename(currentName: string, updatedName: string) {
    const sequence = currentName.split('_').at(0);
    return `${sequence}_${updatedName}.ts`;
  }

  @LoadWithMessage('Renaming your migrations ...')
  private async updateMigration(currentName: string, updatedName: string) {
    await this.trpc.project.updateMigration.mutate({
      projectIdOrSlug: this.config.project.id,
      current_filename: this.extractFilenameOnly(currentName),
      updated_filename: updatedName,
    });

    const oldPath = join(this.config.migration_folder, currentName);
    const newPath = join(
      this.config.migration_folder,
      this.constructUpdatedFilename(currentName, updatedName)
    );
    await rename(oldPath, newPath);

    return;
  }

  async execute(): Promise<void> {
    this.config = await this.cliConfig.readConfig();

    const currentName = await this.params.from.getFilename();
    const updatedName = await this.params.to.getFilename();

    await this.updateMigration(currentName, updatedName);
    console.debug(bgGreen('Rename success!'));

    process.exit(0);
  }
}
