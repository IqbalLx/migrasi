import { createContext } from '@migrasi/shared/trpc/context';
import { router } from '@migrasi/shared/trpc/routers';
import type { Handle } from '@sveltejs/kit';
import { createTRPCHandle } from 'trpc-sveltekit';

export const handle: Handle = createTRPCHandle({ router, createContext });
