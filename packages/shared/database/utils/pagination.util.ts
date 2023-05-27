import { PaginationMeta, PaginationQuery } from '@migrasi/shared/entities';
import { SelectQueryBuilder, sql } from 'kysely';

const parseQuery = (query: PaginationQuery) => {
  const size = query.size ?? 10;
  const page = query.page ?? 1;
  const offset = (page - 1) * size;

  return { size, page, offset };
};

export function paginate<DB, TB extends keyof DB, O>(
  baseQuery: SelectQueryBuilder<DB, TB, O>,
  query: PaginationQuery
): SelectQueryBuilder<DB, TB, O> {
  // if size explicitly defined to -1 return no pagination
  if (query.size === -1) return baseQuery;

  const { offset, size } = parseQuery(query);

  return baseQuery.offset(offset).limit(size);
}

export async function getPaginationMeta<DB, TB extends keyof DB, O>(
  baseQuery: SelectQueryBuilder<DB, TB, O>,
  query: PaginationQuery
): Promise<Pick<PaginationMeta, 'total'>> {
  const { size } = parseQuery(query);

  const allRow = await baseQuery
    .select(sql<string>`coalesce(count(*), 0)`.as('count'))
    .executeTakeFirstOrThrow();

  return {
    total: {
      rows: Number(allRow.count),
      pages: Math.ceil(Number(allRow.count) / size),
    },
  };
}
