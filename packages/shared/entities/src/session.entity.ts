import { z } from 'zod';
import { KyselyTableDefault, TableDefault } from './common';

const SessionEntity = z.object({
  user_id: z.string().uuid(),
  expired_at: z.number(),
});
export const Session = SessionEntity.merge(TableDefault);

export const NewSession = Session.pick({ user_id: true, expired_at: true });

export type Session = z.infer<typeof Session>;
export type NewSession = z.infer<typeof NewSession>;

export type SessionTable = KyselyTableDefault & z.infer<typeof SessionEntity>;
