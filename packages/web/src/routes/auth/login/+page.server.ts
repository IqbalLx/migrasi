import { Actions, fail, redirect } from '@sveltejs/kit';

import { UserLogin } from '@migrasi/shared/entities';
import { parseZodError, parseFormData, handleUnexpectedError } from '$lib/utils/formValidation';

import { authService } from '@migrasi/services/api/auth';

export const actions = {
	login: async ({ request, cookies }) => {
		try {
			const data = await request.formData();
			const userLoginRaw = parseFormData(data);
			const validation = UserLogin.safeParse(userLoginRaw);

			if (!validation.success) {
				const errors = parseZodError(validation.error);

				return fail(422, { errors });
			}

			const userLogin = userLoginRaw as UserLogin;

			const cookie = await authService.login(userLogin);

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
