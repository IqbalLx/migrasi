import { t } from './root.trpc';

export const authRouter = t.router({
	greeting: t.procedure.query(async () => {
		return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}`;
	})
});

export type AuthRouter = typeof authRouter;
