import { z } from 'zod';
import { KyselyTableDefault, TableDefault } from './common';
import { Generated } from 'kysely';

const SessionEntity = z.object({
  user_id: z.string().uuid(),
  expired_at: z.number(),
  is_cli: z.boolean().default(false),
});
export const Session = SessionEntity.merge(TableDefault);

export const NewSession = Session.pick({
  user_id: true,
  expired_at: true,
  is_cli: true,
});
export const Context = Session.pick({ id: true, user_id: true, is_cli: true });

export type Session = z.infer<typeof Session>;
export type NewSession = z.infer<typeof NewSession>;
export type Context = z.infer<typeof Context>;

export type SessionTable = KyselyTableDefault &
  z.infer<typeof SessionEntity> & {
    is_cli: Generated<boolean>;
  };
