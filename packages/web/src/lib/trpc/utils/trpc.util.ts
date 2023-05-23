import { HTTPException } from '@migrasi/shared/errors';
import { TRPCError } from '@trpc/server';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/src/rpc/codes';
import { StatusCodes } from 'http-status-codes';

export function toTRPCError(error: HTTPException): TRPCError {
	const httpException = error.getHTTPError();
	if (httpException.code === StatusCodes.INTERNAL_SERVER_ERROR)
		return new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: httpException.message,
			cause: error.getOriginalError()
		});

	return new TRPCError({
		code: httpException.reason as TRPC_ERROR_CODE_KEY,
		message: httpException.message
	});
}
