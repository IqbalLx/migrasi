import { t } from '@migrasi/shared/trpc/root';
import { z } from 'zod';

import { projectService } from '@migrasi/services/api/project';
import { HTTPException } from '@migrasi/shared/errors';
import { toTRPCError } from '@migrasi/shared/trpc/utils';
import { TRPCError } from '@trpc/server';
import { protectedCliProcedure } from '@migrasi/shared/trpc/middlewares';

export const projectRouter = t.router({
  getAllProjects: protectedCliProcedure.query(async ({ ctx }) => {
    try {
      const projects = await projectService.getAllProjects(ctx);

      return projects;
    } catch (error) {
      console.error(error);

      if (error instanceof HTTPException) {
        const trpcErr = toTRPCError(error);
        console.debug(trpcErr, 'trpc err');

        throw trpcErr;
      }

      console.error(error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }),
  createMigration: protectedCliProcedure
    .input(
      z.object({
        projectOrSlugId: z.string(),
        filename: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const generatedFilename = await projectService.createMigration(
          ctx,
          input.projectOrSlugId,
          input.filename
        );

        return generatedFilename;
      } catch (error) {
        console.error(error);

        if (error instanceof HTTPException) {
          const trpcErr = toTRPCError(error);
          console.debug(trpcErr, 'trpc err');

          throw trpcErr;
        }

        console.error(error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
    }),
});

export type ProjectRouter = typeof projectRouter;
