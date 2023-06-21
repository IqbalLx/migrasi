import { readFile, writeFile } from 'fs/promises';
import { parse, stringify } from 'yaml';
import { join } from 'path';
import { checkFileExists } from '@migrasi/shared/utils';

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

  async readConfig(): Promise<Config | undefined> {
    const configFilePath = join(process.cwd(), this.CONFIG_FILENAME);
    const exists = await checkFileExists(configFilePath);
    if (!exists) return;

    const file = await readFile(configFilePath, 'utf-8');
    return parse(file) as Config;
  }

  async writeConfig(config: Config): Promise<void> {
    const configFilePath = join(process.cwd(), this.CONFIG_FILENAME);
    await writeFile(configFilePath, stringify(config));

    return;
  }
}
