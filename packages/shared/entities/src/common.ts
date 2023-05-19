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
export type WithoutDefaultTimestamp<T extends TableDefault> = Omit<
  T,
  'created_at' | 'updated_at' | 'deleted_at'
>;

export function omitTimestamp<T extends typeof TableDefault>(schema: T) {
  return schema.omit({
    created_at: true,
    updated_at: true,
    deleted_at: true,
  });
}

export function mapTableDefault<
  T extends TableDefault,
  C extends true | false,
  R = C extends true ? WithoutDefaultTimestamp<T> : T
>(data: T, includeTimestamp: C): R {
  if (!includeTimestamp)
    return {
      id: data.id,
    } as R;

  return {
    id: data.id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
  } as R;
}

export type KyselyTableDefault = {
  id: Generated<string>;
  created_at: ColumnType<number, number | undefined, never>;
  updated_at: ColumnType<number, number | undefined, number>;
  deleted_at: ColumnType<number | null, number | undefined, number>;
};

export const PaginationMeta = z.object({
  total: z.object({
    pages: z.number(),
    rows: z.number(),
  }),
  current: z.object({
    page: z.number(),
    rows: z.number(),
  }),
});

export type PaginationMeta = z.infer<typeof PaginationMeta>;
export type WithPagination<T> = { data: T[] } & PaginationMeta;

export function wrapInPagination<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
) {
  return PaginationMeta.merge(
    z.object({
      data: z.array(schema),
    })
  );
}
