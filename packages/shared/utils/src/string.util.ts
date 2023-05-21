import { z } from 'zod';

const UUID = z.string().uuid();

export function isUUID(input: string): boolean {
  const res = UUID.safeParse(input);
  return res.success;
}
