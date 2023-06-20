import { t } from '@migrasi/shared/trpc/root';

import { authRouter } from './authRouter.trpc';
import { projectRouter } from './projectRouter.trpc';

export const router = t.router({ auth: authRouter, project: projectRouter });
export type Router = typeof router;
