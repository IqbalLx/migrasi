import { fail } from '@sveltejs/kit';
import { HTTPException, InternalServerError } from '@migrasi/shared/errors';
import { ZodError } from 'zod';

export function parseFormData(data: FormData) {
	const obj: { [key: string]: unknown } = {};
	data.forEach((value, key) => (obj[key] = value));

	return obj;
}

export function parseZodError(zodError: ZodError) {
	return zodError.errors.map((error) => {
		return {
			field: error.path[0],
			message: error.message
		};
	});
}

export function handleUnexpectedError(error: Error) {
	if (error instanceof HTTPException) {
		const httpErr = error.getHTTPError();
		return fail(httpErr.code, httpErr);
	}

	console.error(error);

	const error500 = new InternalServerError({
		message: error.message,
		error: error
	});
	return fail(500, error500.getHTTPError());
}
