import { initTRPC } from '@trpc/server';
import { TRPCContext } from '../context/context.trpc';

export const t = initTRPC.context<TRPCContext>().create();
