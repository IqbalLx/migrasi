import { t } from '@migrasi/shared/trpc/root';

import { authRouter } from './authRouter.trpc';

export const router = t.router({ auth: authRouter });
export type Router = typeof router;
