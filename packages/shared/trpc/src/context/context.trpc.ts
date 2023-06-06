import type { RequestEvent } from '@sveltejs/kit';
import { inferAsyncReturnType } from '@trpc/server';

export async function createContext(event: RequestEvent) {
  const cookie = event.cookies.get('migrasi_sess');
  const authHeader = event.request.headers.get('authorization')?.split(' ')[1];
  return {
    token: cookie ?? authHeader ?? null,
  };
}

export type TRPCContext = inferAsyncReturnType<typeof createContext>;
