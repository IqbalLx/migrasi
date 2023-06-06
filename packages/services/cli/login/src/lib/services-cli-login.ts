import type { TRPC } from '@migrasi/shared/trpc/clients/cli';
import { Config } from '@migrasi/shared/config';
import { stringify } from 'yaml';
import { checkFileExists } from '@migrasi/shared/utils';
import { mkdir, writeFile } from 'fs/promises';

import chalk from 'chalk';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';

async function askEmail() {
  const answer = await inquirer.prompt<{ email: string }>({
    name: 'email',
    type: 'input',
    message: 'What is your migrasi email?',
  });

  return answer.email;
}

async function askPassword() {
  const answer = await inquirer.prompt<{ password: string }>({
    name: 'password',
    type: 'password',
    message: 'What is your password?',
  });

  return answer.password;
}

async function doLogin(trpc: TRPC, email: string, password: string) {
  const spinner = createSpinner('Logging you in ....');
  try {
    const token = await trpc.auth.cliLogin.query({ email, password });

    spinner.success();

    return token;
  } catch (error) {
    spinner.error();

    return;
  }
}

export async function login(trpc: TRPC) {
  const email = await askEmail();
  const password = await askPassword();

  const token = await doLogin(trpc, email, password);
  if (token === undefined) {
    console.log(chalk.bgRed('Auth error'));
    process.exit(1);
  }

  const CLI_CONFIG_PATH = `${Config.cli.basedir}/${Config.cli.configName}`;
  const configExists = checkFileExists(CLI_CONFIG_PATH);
  if (!configExists) await mkdir(Config.cli.basedir);

  await writeFile(CLI_CONFIG_PATH, stringify({ token: token.value }));

  console.log(chalk.bgGreen('Auth success'));
  process.exit(0);
}
