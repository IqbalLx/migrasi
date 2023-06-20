import { LoadWithMessage, type TRPC } from '@migrasi/shared/trpc/clients/cli';
import { Config } from '@migrasi/shared/config';

import { Command } from 'typed-cmdargs';
import { checkFileExists } from '@migrasi/shared/utils';

import { unlink } from 'fs/promises';

export class Logout implements Command {
  constructor(private trpc: TRPC) {}

  @LoadWithMessage('Logging you out ...')
  private logout() {
    return this.trpc.auth.cliLogout.query();
  }

  async execute(): Promise<void> {
    await this.logout();

    const CLI_CONFIG_PATH = `${Config.cli.basedir}/${Config.cli.configName}`;
    const configExists = await checkFileExists(CLI_CONFIG_PATH);
    if (configExists) await unlink(CLI_CONFIG_PATH);

    process.exit(0);
  }
}
