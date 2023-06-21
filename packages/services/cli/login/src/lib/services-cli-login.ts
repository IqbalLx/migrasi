import type { TRPC } from '@migrasi/shared/trpc/clients/cli';
import { Config } from '@migrasi/shared/config';
import { stringify } from 'yaml';
import { checkFileExists, checkFolderExists } from '@migrasi/shared/utils';
import { mkdir, writeFile } from 'fs/promises';

import { bgRed, bgGreen } from 'chalk';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';

import { Command } from 'typed-cmdargs';

export class Login implements Command {
  constructor(private trpc: TRPC) {}

  private async askEmail() {
    const answer = await inquirer.prompt<{ email: string }>({
      name: 'email',
      type: 'input',
      message: 'What is your migrasi email?',
    });

    return answer.email;
  }

  private async askPassword() {
    const answer = await inquirer.prompt<{ password: string }>({
      name: 'password',
      type: 'password',
      message: 'What is your password?',
    });

    return answer.password;
  }

  private async login(email: string, password: string) {
    const spinner = createSpinner('Logging you in ....');
    try {
      const token = await this.trpc.auth.cliLogin.query({ email, password });

      spinner.success();

      return token;
    } catch (error) {
      spinner.error();

      return;
    }
  }

  async execute() {
    const email = await this.askEmail();
    const password = await this.askPassword();

    const token = await this.login(email, password);
    if (token === undefined) {
      console.log(bgRed('Auth error'));
      process.exit(1);
    }

    const CLI_CONFIG_PATH = `${Config.cli.basedir}/${Config.cli.configName}`;
    const configFolderExists = await checkFolderExists(Config.cli.basedir);
    if (!configFolderExists) await mkdir(Config.cli.basedir);

    await writeFile(CLI_CONFIG_PATH, stringify({ token: token.value }));

    console.log(bgGreen('Auth success'));
    process.exit(0);
  }
}
