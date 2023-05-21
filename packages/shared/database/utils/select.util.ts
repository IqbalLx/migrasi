import { SelectExpression, SelectQueryBuilder } from 'kysely';
import { Tables } from '../tables.interface';
import { From } from 'kysely/dist/cjs/parser/table-parser';
import { Nullable } from 'kysely/dist/cjs/util/type-utils';

export function selectAllAlias<DB, TB extends keyof DB, O>(
  qb: SelectQueryBuilder<DB, TB, O>,
  filedAlias: string,
  tableAlias: TB
) {
  const selection: readonly SelectExpression<DB, TB>[] = [];
  return qb.select(selection);
}
