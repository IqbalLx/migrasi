import { createContext } from './lib/trpc/context.trpc';
import { router } from './lib/trpc/routers';
import type { Handle } from '@sveltejs/kit';
import { createTRPCHandle } from 'trpc-sveltekit';

export const handle: Handle = createTRPCHandle({ router, createContext });
