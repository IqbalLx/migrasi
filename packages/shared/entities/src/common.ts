import { z } from 'zod';
import { Generated, ColumnType } from 'kysely';
import { toUnixInSeconds } from '@migrasi/shared/utils';

export const HTTPError = z.object({
  code: z.number(),
  internal_code: z.string().optional(),
  reason: z.string(), // reason phrase from http status code
  message: z.string(), // message of why this error occured
  internal_message: z.string().optional(),
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
export type WithoutTableDefault<T extends TableDefault> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'deleted_at'
>;

export function omitTimestamp<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
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
    created_at: toUnixInSeconds(new Date(data.created_at)),
    updated_at: toUnixInSeconds(new Date(data.updated_at)),
    deleted_at:
      data.deleted_at !== null
        ? toUnixInSeconds(new Date(data.deleted_at))
        : null,
  } as R;
}

export type KyselyTableDefault = {
  id: Generated<string>;
  created_at: ColumnType<number, number | undefined, never>;
  updated_at: ColumnType<number, number | undefined, number>;
  deleted_at: ColumnType<number | null, number | undefined, number>;
};

export const PaginationQuery = z.object({
  page: z.number().int().min(1).default(1).optional(),
  size: z.number().int().default(20).optional(),
});
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
export type PaginationQuery = z.infer<typeof PaginationQuery>;

export function wrapInPagination<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
) {
  return PaginationMeta.merge(
    z.object({
      data: z.array(schema),
    })
  );
}
