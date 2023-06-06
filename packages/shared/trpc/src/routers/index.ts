import { t } from './root.trpc';

import { authRouter } from './authRouter.trpc';

export const router = t.router({ auth: authRouter });

export type Router = typeof router;
