import { trpc } from '@migrasi/shared/trpc/clients/cli';

import { login } from '@migrasi/services/cli/login';

export async function cli() {
  const command = process.argv[2];
  if (command === undefined) throw Error('no command provided');

  switch (command) {
    case 'login':
      await login(trpc);
      break;

    default:
      break;
  }

  process.exit(0);
}
