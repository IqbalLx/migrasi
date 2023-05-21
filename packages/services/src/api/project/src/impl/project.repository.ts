import { Kysely, sql } from 'kysely';
import { Tables, getPaginationMeta, paginate } from '@migrasi/shared/database';

import { IProjectRepository } from '../project.interface';
import {
  PaginationMeta,
  Project,
  ProjectMemberPaginationQuery,
  ProjectMigration,
  ProjectMigrationQueryOptions,
  User,
  WithoutTableDefault,
} from '@migrasi/shared/entities';

export class ProjectRepository implements IProjectRepository {
  constructor(private db: Kysely<Tables>) {}

  // Project
  async createProject(newProject: WithoutTableDefault<Project>): Promise<void> {
    await this.db.insertInto('projects').values(newProject).execute();

    return;
  }

  async getProject(
    projectIdOrSlug: string
  ): Promise<[project: Project, author: User] | undefined> {
    const query = this.db
      .selectFrom('projects as p')
      .innerJoin('users as u', 'u.id', 'p.author_id')
      .where('p.id', '=', projectIdOrSlug)
      .orWhere('p.slug', '=', projectIdOrSlug);

    const [project, author] = await Promise.all([
      query.selectAll('p').executeTakeFirst(),
      query.selectAll('u').executeTakeFirst(),
    ]);

    if (project === undefined || author === undefined) return undefined;

    return [project, author];
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.db.deleteFrom('projects').where('id', '=', projectId).execute();

    return;
  }

  // Project Members
  searchMembersToAdd(
    projectId: string,
    memberEmailOrName: string,
    limit = 10
  ): Promise<Array<User & { is_already_member: boolean }>> {
    return this.db
      .selectFrom('users as u')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('project_members as pm')
            .distinctOn('pm.member_id')
            .where('pm.project_id', '=', projectId)
            .whereRef('pm.member_id', '=', 'u.id')
            .select(sql<string>`1`.as('one'))
            .as('pm'),
        (join) => join.onTrue()
      )
      .where('u.email', 'ilike', `%${memberEmailOrName}%`)
      .orWhere('u.name', 'ilike', `%${memberEmailOrName}%`)
      .selectAll(['u'])
      .select(
        sql<boolean>`(
            CASE WHEN pm.one IS NULL 
            THEN FALSE 
            ELSE TRUE 
            END
        )`.as('is_already_member')
      )
      .limit(limit)
      .execute();
  }

  async createNewProjectMember(
    memberId: string,
    projectId: string
  ): Promise<void> {
    await this.db
      .insertInto('project_members')
      .values({
        project_id: projectId,
        member_id: memberId,
      })
      .execute();

    return;
  }

  async isMemberOf(userId: string, projectId: string): Promise<boolean> {
    const member = await this.db
      .selectFrom('project_members as pm')
      .where('pm.member_id', '=', userId)
      .where('pm.project_id', '=', projectId)
      .select(
        sql<boolean>`(
            CASE WHEN pm.one IS NULL 
            THEN FALSE 
            ELSE TRUE 
            END
        )`.as('is_exists')
      )
      .executeTakeFirst();

    if (member === undefined) return false;

    return member.is_exists;
  }

  async getAccountAndMemberStatus(
    email: string,
    projectId: string
  ): Promise<{ userId: string | null; alreadyMember: boolean }> {
    const query = this.db
      .selectFrom('users as u')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('project_members as pm')
            .distinctOn('pm.member_id')
            .where('pm.project_id', '=', projectId)
            .whereRef('pm.member_id', '=', 'u.id')
            .select(sql<string>`1`.as('one'))
            .as('pm'),
        (join) => join.onTrue()
      )
      .where('u.email', '=', email);

    const [user, status] = await Promise.all([
      query.select('u.id').executeTakeFirst(),
      query
        .select(
          sql<boolean>`(
                  CASE WHEN pm.one IS NULL 
                  THEN FALSE 
                  ELSE TRUE 
                  END
              )`.as('is_already_member')
        )
        .executeTakeFirst(),
    ]);

    return {
      userId: user?.id ?? null,
      alreadyMember: status?.is_already_member ?? false,
    };
  }

  async countMembers(projectId: string): Promise<number> {
    const project = await this.db
      .selectFrom('project_members as pm')
      .where('pm.project_id', '=', projectId)
      .select(sql<string>`coalesce(count('id'), 0)`.as('count'))
      .executeTakeFirst();

    return Number(project?.count) ?? 0;
  }

  private getProjectMembersBaseQuery(
    projectId: string,
    query: ProjectMemberPaginationQuery
  ) {
    let baseQuery = this.db
      .selectFrom('project_members as pm')
      .innerJoin('users as u', 'pm.member_id', 'u.id')
      .leftJoinLateral(
        (qb) =>
          qb
            .selectFrom('project_migrations as pmi')
            .whereRef('pmi.project_id', '=', 'pm.project_id')
            .whereRef('pmi.created_by', '=', 'pm.member_id')
            .select(sql<string>`coalesce(count(pmi.id), 0)`.as('contributions'))
            .as('pmi'),
        (join) => join.onTrue()
      )
      .where('pm.project_id', '=', projectId)
      .selectAll(['u'])
      .select('pmi.contributions as contributions');

    if (query.filter?.name)
      baseQuery = baseQuery.where('u.name', 'ilike', `%${query.filter.name}%`);
    if (query.filter?.email)
      baseQuery = baseQuery.where(
        'u.email',
        'ilike',
        `%${query.filter.email}%`
      );

    if (query.sort) {
      if (query.sort?.contribution)
        baseQuery = baseQuery.orderBy(
          'pmi.contributions',
          query.sort.contribution
        );
      if (query.sort?.name)
        baseQuery = baseQuery.orderBy('u.name', query.sort.name);
    } else {
      baseQuery = baseQuery.orderBy('created_at', 'asc');
    }

    return baseQuery;
  }

  async getMembers(
    projectId: string,
    query: ProjectMemberPaginationQuery
  ): Promise<{ user: User; contributions: number }[]> {
    const finalQuery = this.getProjectMembersBaseQuery(projectId, query);
    const users = await finalQuery
      .$call((qb) => paginate(qb, { size: query.size, page: query.page }))
      .execute();

    return users.map((userRaw) => {
      const { contributions, ...user } = userRaw;

      return { user, contributions: Number(contributions) ?? 0 };
    });
  }

  async getMembersWithPaginationMeta(
    projectId: string,
    query: ProjectMemberPaginationQuery
  ): Promise<[{ user: User; contributions: number }[], PaginationMeta]> {
    const finalQuery = this.getProjectMembersBaseQuery(projectId, query);
    const [users, pagination] = await Promise.all([
      finalQuery
        .$call((qb) => paginate(qb, { size: query.size, page: query.page }))
        .execute(),
      getPaginationMeta(finalQuery, query),
    ]);

    return [
      users.map((userRaw) => {
        const { contributions, ...user } = userRaw;

        return { user, contributions: Number(contributions) ?? 0 };
      }),
      pagination,
    ];
  }

  async deleteMembers(projectId: string, memberIds: string[]): Promise<void> {
    await this.db
      .deleteFrom('project_members as pm')
      .where('pm.project_id', '=', projectId)
      .where('pm.member_id', 'in', memberIds)
      .execute();

    return;
  }

  // Project Migrations
  private getMigrationsBaseQuery(
    projectId: string,
    query: ProjectMigrationQueryOptions
  ) {
    let baseQuery = this.db
      .selectFrom('project_migrations as pmi')
      .innerJoin('users as u', 'pmi.created_by', 'u.id')
      .where('pmi.project_id', '=', projectId)
      .orderBy('created_at', query.sort ?? 'desc');

    if (query.filter) {
      const { search, start_date, end_date, author_id } = query.filter;

      if (search !== undefined)
        baseQuery = baseQuery.where('pmi.filename', 'ilike', search);

      if (start_date !== undefined && end_date !== undefined)
        baseQuery = baseQuery
          .where('created_at', '>=', start_date)
          .where('created_at', '<=', end_date);

      if (author_id !== undefined)
        baseQuery = baseQuery.where('pmi.created_by', '=', author_id);
    }

    return baseQuery;
  }
  async getMigrations(
    projectId: string,
    query: ProjectMigrationQueryOptions
  ): Promise<Array<{ author: User; projectMigration: ProjectMigration }>> {
    const finalQuery = this.getMigrationsBaseQuery(projectId, query).$call(
      (qb) => paginate(qb, query)
    );

    const [migrations, authors] = await Promise.all([
      finalQuery.selectAll('pmi').execute(),
      finalQuery.selectAll('u').execute(),
    ]);

    return migrations.map((migration, index) => {
      return { author: authors[index], projectMigration: migration };
    });
  }

  async getMigrationsWithPaginationMeta(
    projectId: string,
    query: ProjectMigrationQueryOptions
  ): Promise<
    [
      Array<{ author: User; projectMigration: ProjectMigration }>,
      PaginationMeta
    ]
  > {
    const finalRawQuery = this.getMigrationsBaseQuery(projectId, query);
    const finalQuery = finalRawQuery.$call((qb) => paginate(qb, query));

    const [migrations, authors, pagination] = await Promise.all([
      finalQuery.selectAll('pmi').execute(),
      finalQuery.selectAll('u').execute(),
      getPaginationMeta(finalRawQuery, query),
    ]);

    const datas = migrations.map((migration, index) => {
      return { author: authors[index], projectMigration: migration };
    });
    return [datas, pagination];
  }
}
