import { ArgumentParser, NoContextHelp, NoHelp } from 'typed-cmdargs';

import { trpc } from '@migrasi/shared/trpc/clients/cli';

import { CLIConfig } from '@migrasi/services/cli/config';
import { Login } from '@migrasi/services/cli/login';
import { Logout } from '@migrasi/services/cli/logout';
import { Setup } from '@migrasi/services/cli/setup';
import { Create } from '@migrasi/services/cli/create';
import { Check } from '@migrasi/services/cli/check';
import {
  Rename,
  CurrentFilenameFlag,
  UpdateFilenameFlag,
} from '@migrasi/services/cli/rename';
import { Delete } from '@migrasi/services/cli/delete';

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
  })
  .push('rename', {
    desc: 'Rename your migration filename',
    construct: (_, params) => new Rename(trpc, cliConfig, params),
    flags: {
      from: {
        short: 'f',
        arg: 'filename',
        desc: 'Specify which current migration filename to be renamed',
        overrideValue: (arg) => new CurrentFilenameFlag(cliConfig, arg),
        defaultValue: new CurrentFilenameFlag(cliConfig, undefined),
      },
      to: {
        short: 't',
        arg: 'filename',
        desc: 'Specify new name for migration',
        overrideValue: (arg) => new UpdateFilenameFlag(arg),
        defaultValue: new UpdateFilenameFlag(undefined),
      },
    },
  })
  .push('delete', {
    desc: 'Delete migration',
    construct: (_, params) => new Delete(trpc, cliConfig, params),
    flags: {
      yes: {
        short: 'y',
        desc: 'Skip confirmation for deleting confirmation file',
        overrideValue: true,
        defaultValue: false,
      },
    },
  });
