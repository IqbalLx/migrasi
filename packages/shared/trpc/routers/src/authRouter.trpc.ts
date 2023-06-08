import { UserLogin } from '@migrasi/shared/entities';
import { t } from '@migrasi/shared/trpc/root';

import { authService } from '@migrasi/services/api/auth';
import { HTTPException } from '@migrasi/shared/errors';
import { toTRPCError } from '@migrasi/shared/trpc/utils';
import { TRPCError } from '@trpc/server';
import {
  protectedCliProcedure,
  protectedWebProcedure,
  unprotectedProcedure,
} from '@migrasi/shared/trpc/middlewares';

export const authRouter = t.router({
  greeting: unprotectedProcedure.query(() => {
    return 'Hello World';
  }),
  cliLogin: unprotectedProcedure.input(UserLogin).query(async ({ input }) => {
    try {
      const token = await authService.cliLogin(input);

      return token;
    } catch (error) {
      if (error instanceof HTTPException) {
        const trpcErr = toTRPCError(error);
        console.debug(trpcErr, 'trpc err');

        throw trpcErr;
      }

      console.error(error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),
  cliLogout: protectedCliProcedure.query(async ({ ctx }) => {
    try {
      await authService.cliLogout(ctx.id);
    } catch (error) {
      if (error instanceof HTTPException) throw toTRPCError(error);

      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),
  webLogout: protectedWebProcedure.query(async ({ ctx }) => {
    try {
      await authService.logout(ctx.id);
    } catch (error) {
      if (error instanceof HTTPException) throw toTRPCError(error);

      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),
});

export type AuthRouter = typeof authRouter;
