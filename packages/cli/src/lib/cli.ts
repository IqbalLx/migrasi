import { ArgumentParser, NoContextHelp, NoHelp } from 'typed-cmdargs';

import { trpc } from '@migrasi/shared/trpc/clients/cli';

import { CLIConfig } from '@migrasi/services/cli/config';
import { Login } from '@migrasi/services/cli/login';
import { Logout } from '@migrasi/services/cli/logout';
import { Setup } from '@migrasi/services/cli/setup';
import { Create } from '@migrasi/services/cli/create';
import { Check } from '@migrasi/services/cli/check';

const cliConfig = new CLIConfig();

export const argParser = new ArgumentParser(new NoHelp(), new NoContextHelp())
  .push('login', {
    desc: 'Login to your migrasi account',
    construct: () => new Login(trpc),
    flags: {},
  })
  .push('logout', {
    desc: 'Logout from your current session',
    construct: () => new Logout(trpc),
    flags: {},
  })
  .push('setup', {
    desc: 'Setup migrasi config in your workspace',
    construct: () => new Setup(trpc, cliConfig),
    flags: {},
  })
  .push('create', {
    desc: 'Create new migration file',
    arg: 'filename',
    construct: (filename) => new Create(trpc, cliConfig, filename),
    flags: {},
  })
  .push('check', {
    desc: 'Compare local migration with remote',
    construct: (_, params) => new Check(trpc, cliConfig, params),
    flags: {
      validate: {
        short: 'v',
        desc: 'If enabled return non-zero exit code when there is difference between local and remote. Suitable for CI environment',
        overrideValue: true,
        defaultValue: false,
      },
    },
  });
