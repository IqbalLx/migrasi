import type { RequestEvent } from '@sveltejs/kit';
import { inferAsyncReturnType } from '@trpc/server';

export async function createContext(event: RequestEvent) {
	const authHeaderValue = event.request.headers.get('authorization');
	return {
		token: authHeaderValue
	};
}

export type TRPCContext = inferAsyncReturnType<typeof createContext>;

// import { Context } from '@migrasi/shared/entities';
// import { authService } from '@migrasi/services/api/auth';
// import { toTRPCError } from './trpc.util';
// import { HTTPException } from '@migrasi/shared/errors';

// if (authHeaderValue === undefined)
// 		throw new TRPCError({
// 			code: 'UNAUTHORIZED',
// 			message: 'auth failed'
// 		});

// 	const token = authHeaderValue?.split(' ')[1];
// 	if (token === undefined)
// 		throw new TRPCError({
// 			code: 'UNAUTHORIZED',
// 			message: 'auth failed'
// 		});

// 	try {
// 		const context: Context = await authService.authorize(token);

// 		return context;
// 	} catch (error) {
// 		if (error instanceof HTTPException) throw toTRPCError(error);

// 		console.error(error);
// 		throw new TRPCError({
// 			code: 'INTERNAL_SERVER_ERROR',
// 			message: (error as Error).message,
// 			cause: error as Error
// 		});
// 	}
