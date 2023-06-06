import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { Router } from '../routers';

import { Config } from '@migrasi/shared/config';

import { parse } from 'yaml';
import { checkFileExists } from '@migrasi/shared/utils';

Config.system.validate();
Config.cli.validate();

export async function getToken(): Promise<string | undefined> {
  const CLI_CONFIG_PATH = `${Config.cli.basedir}/${Config.cli.configName}`;

  const configExists = await checkFileExists(CLI_CONFIG_PATH);
  if (!configExists) return undefined;

  const config = parse(CLI_CONFIG_PATH) as { access_token: string };
  return `Bearer ${config.access_token}`;
}

export const trpc = createTRPCProxyClient<Router>({
  links: [
    httpBatchLink({
      url: `${Config.system.baseUrl}/trpc`,

      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          authorizaton: await getToken(),
        };
      },
    }),
  ],
});

export type TRPC = typeof trpc;
