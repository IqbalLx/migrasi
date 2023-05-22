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
  const { offset, size } = parseQuery(query);
  return baseQuery.offset(offset).limit(size);
}

export async function getPaginationMeta<DB, TB extends keyof DB, O>(
  baseQuery: SelectQueryBuilder<DB, TB, O>,
  query: PaginationQuery
): Promise<PaginationMeta> {
  const { size, page } = parseQuery(query);
  const [currRow, allRow] = await Promise.all([
    baseQuery
      .$call((qb) => paginate(qb, { size: query.size, page: query.page }))
      .select(sql<string>`coalesce(count(*), 0)`.as('count'))
      .executeTakeFirstOrThrow(),
    baseQuery
      .select(sql<string>`coalesce(count(*), 0)`.as('count'))
      .executeTakeFirstOrThrow(),
  ]);

  return {
    total: {
      rows: Number(allRow.count),
      pages: Math.ceil(Number(allRow.count) / size),
    },
    current: {
      page,
      rows: Number(currRow.count),
    },
  };
}
