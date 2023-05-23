import type { RequestEvent } from '@sveltejs/kit';
import { inferAsyncReturnType } from '@trpc/server';

export async function createContext(event: RequestEvent) {
	const authHeaderValue = event.request.headers.get('authorization');
	return {
		token: authHeaderValue
	};
}

export type TRPCContext = inferAsyncReturnType<typeof createContext>;
