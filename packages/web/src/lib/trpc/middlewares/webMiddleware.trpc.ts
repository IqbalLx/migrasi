import { TRPCError } from '@trpc/server';

import { t } from '../routers/root.trpc';
import { Context } from '@migrasi/shared/entities';
import { authService } from '@migrasi/services/api/auth';
import { toTRPCError } from '../utils/trpc.util';
import { HTTPException } from '@migrasi/shared/errors';

const webAuthorize = t.middleware(async (opts) => {
	const { ctx } = opts;
	const authHeaderValue = ctx.token;

	if (authHeaderValue === undefined)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'auth failed'
		});

	const token = authHeaderValue?.split(' ')[1];
	if (token === undefined)
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'auth failed'
		});

	try {
		const context: Context = await authService.authorize(token);

		return opts.next({
			ctx: context
		});
	} catch (error) {
		if (error instanceof HTTPException) throw toTRPCError(error);

		console.error(error);
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: (error as Error).message,
			cause: error as Error
		});
	}
});

export const webAuthorizedProcedure = t.procedure.use(webAuthorize);
