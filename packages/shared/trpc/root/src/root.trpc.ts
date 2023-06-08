import { initTRPC } from '@trpc/server';
import { TRPCContext } from '@migrasi/shared/trpc/context';

export const t = initTRPC.context<TRPCContext>().create();
