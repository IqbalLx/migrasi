import {
  TRPCClientError,
  createTRPCProxyClient,
  httpBatchLink,
} from '@trpc/client';
import { createSpinner } from 'nanospinner';
import { bgRed, inverse } from 'chalk';

import type { Router } from '@migrasi/shared/trpc/routers';

import { Config } from '@migrasi/shared/config';

import { parse } from 'yaml';
import { readFile } from 'fs/promises';
import { checkFileExists } from '@migrasi/shared/utils';

Config.system.validate();
Config.cli.validate();

export async function getToken(): Promise<string | undefined> {
  const CLI_CONFIG_PATH = `${Config.cli.basedir}/${Config.cli.configName}`;

  const configExists = await checkFileExists(CLI_CONFIG_PATH);
  if (!configExists) return undefined;

  const configFile = await readFile(CLI_CONFIG_PATH, 'utf8');
  const config = parse(configFile) as { token: string };

  return `Bearer ${config.token}`;
}

export const trpc = createTRPCProxyClient<Router>({
  links: [
    httpBatchLink({
      url: `${Config.system.baseUrl}/trpc`,

      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          authorization: await getToken(),
        };
      },
    }),
  ],
});

export type TRPC = typeof trpc;

export function isTRPCClientError(
  cause: unknown
): cause is TRPCClientError<Router> {
  return cause instanceof TRPCClientError;
}

export function LoadWithMessage(spinnerMessage: string) {
  return (
    target: unknown,
    methodName: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const spinner = createSpinner(spinnerMessage);
      try {
        const result = await originalMethod.apply(this, args);
        spinner.success();

        return result;
      } catch (error) {
        spinner.error();

        if (isTRPCClientError(error)) {
          if (error.data?.httpStatus === 401) {
            console.log(
              `${bgRed('session expired!')} run ${inverse('migrasi login')}`
            );
          } else {
            console.log(`${bgRed('unexpected error')} ${error.message}`);
          }
        } else {
          console.log(
            `${bgRed('unexpected error')} ${(error as Error).message}`
          );
        }

        process.exit(1);
      }
    };

    return descriptor;
  };
}
