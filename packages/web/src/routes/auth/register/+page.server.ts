import { Actions, fail, redirect } from '@sveltejs/kit';

import { UserRegister } from '@migrasi/shared/entities';
import { parseZodError, parseFormData, handleUnexpectedError } from '$lib/utils/formValidation';

import { authService } from '@migrasi/services/api/auth';

export const actions = {
	register: async ({ request, cookies }) => {
		try {
			const data = await request.formData();
			const userRegisterRaw = parseFormData(data);
			const validation = UserRegister.safeParse(userRegisterRaw);

			if (!validation.success) {
				const errors = parseZodError(validation.error);

				return fail(422, { errors });
			}

			const userRegister = userRegisterRaw as UserRegister;

			const cookie = await authService.register(userRegister);

			cookies.set('migrasi_sess', cookie.value, {
				path: '/',
				expires: new Date(cookie.expiresAtInMilliseconds),
				maxAge: cookie.maxAgeInSeconds
			});
		} catch (error) {
			return handleUnexpectedError(error as Error);
		}

		throw redirect(302, '/home');
	}
} satisfies Actions;
