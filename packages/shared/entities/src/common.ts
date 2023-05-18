import { z } from 'zod';
import { Generated, ColumnType } from 'kysely';

export const HTTPError = z.object({
  code: z.number(),
  reason: z.string(), // reason phrase from http status code
  message: z.string(), // message of why this error occured
  error: z.array(z.string()).nullable(), // nullable stack trace
});

export type HTTPError = z.infer<typeof HTTPError>;

export const TableDefault = z.object({
  id: z.string().uuid(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
});

export type TableDefault = z.infer<typeof TableDefault>;

export function mapTableDefault<T extends TableDefault>(data: T): TableDefault {
  return {
    id: data.id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
  };
}

export type KyselyTableDefault = {
  id: Generated<string>;
  created_at: ColumnType<number, number | undefined, never>;
  updated_at: ColumnType<number, number | undefined, number>;
  deleted_at: ColumnType<number | null, number | undefined, number>;
};
