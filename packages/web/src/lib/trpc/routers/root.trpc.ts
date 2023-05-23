import { initTRPC } from '@trpc/server';
import { TRPCContext } from '../context.trpc';

export const t = initTRPC.context<TRPCContext>().create();
