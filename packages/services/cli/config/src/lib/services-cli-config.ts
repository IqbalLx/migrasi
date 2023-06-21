import { readFile, writeFile } from 'fs/promises';
import { parse, stringify } from 'yaml';
import { join } from 'path';
import { checkFileExists } from '@migrasi/shared/utils';
import { bgRed, inverse } from 'chalk';

export type Config = {
  project: {
    id: string;
    slug: string;
    name: string;
  };
  migration_folder: string;
};

export class CLIConfig {
  private CONFIG_FILENAME = 'migrasi.yaml';

  async readConfig(): Promise<Config> {
    const configFilePath = join(process.cwd(), this.CONFIG_FILENAME);
    const exists = await checkFileExists(configFilePath);
    if (!exists) {
      console.log(
        `${bgRed('Config not found')} run ${inverse('migrasi setup')} first`
      );
      process.exit(1);
    }

    const file = await readFile(configFilePath, 'utf-8');
    const config = parse(file) as Config;
    return {
      ...config,
      migration_folder: join(process.cwd(), config.migration_folder),
    };
  }

  async writeConfig(config: Config): Promise<void> {
    const configFilePath = join(process.cwd(), this.CONFIG_FILENAME);
    await writeFile(configFilePath, stringify(config));

    return;
  }
}
