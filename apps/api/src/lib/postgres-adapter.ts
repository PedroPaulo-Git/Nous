import type { Pool } from 'pg';

type FilterOperator = '=' | '>' | '>=' | '<=';
type QueryResponse<T = any> = { data: T | null; error: { message: string } | null };

const DEFAULT_CONFLICT_COLUMNS: Record<string, string[]> = {
  profiles: ['id'],
  password_vault: ['user_id'],
  drinkwater_summary: ['user_id', 'drinkwater_day'],
  user_workout_days: ['user_id', 'day_of_week'],
  user_study_stats: ['user_id'],
};

function quoteIdent(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function tableRef(table: string) {
  return `${quoteIdent('public')}.${quoteIdent(table)}`;
}

function normalizeColumns(columns?: string) {
  if (!columns || columns.trim() === '') {
    return { baseColumns: '*', relation: null as null | { alias: string; column: string; table: string } };
  }

  const trimmed = columns.trim();
  const relationMatch = trimmed.match(/(.+),\s*([a-zA-Z_][\w]*):([a-zA-Z_][\w]*)\s*\(\*\)\s*$/s);
  if (!relationMatch) {
    return { baseColumns: trimmed, relation: null as null | { alias: string; column: string; table: string } };
  }

  const [, base, alias, column] = relationMatch;
  const relatedTableMap: Record<string, string> = {
    exercise_id: 'workout_exercises',
  };

  return {
    baseColumns: base.trim() || '*',
    relation: {
      alias,
      column,
      table: relatedTableMap[column] ?? column.replace(/_id$/, 's'),
    },
  };
}

function buildColumnList(columns: string) {
  const trimmed = columns.trim();
  if (trimmed === '*' || trimmed === '') return '*';
  return trimmed
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean)
    .map((column) => `${quoteIdent(column)}`)
    .join(', ');
}

function splitTopLevel(input: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  if (current) parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function decodeFilterValue(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseOrExpression(input: string, params: any[]) {
  const buildNode = (expression: string): string => {
    if (expression.startsWith('and(') && expression.endsWith(')')) {
      const inner = expression.slice(4, -1);
      return `(${splitTopLevel(inner).map(buildNode).join(' AND ')})`;
    }

    const parts = expression.split('.');
    if (parts.length < 3) {
      throw new Error(`Unsupported filter expression: ${expression}`);
    }

    const [column, operator, ...rest] = parts;
    params.push(decodeFilterValue(rest.join('.')));
    const paramIndex = params.length;

    switch (operator) {
      case 'eq':
        return `${quoteIdent(column)} = $${paramIndex}`;
      case 'gt':
        return `${quoteIdent(column)} > $${paramIndex}`;
      case 'gte':
        return `${quoteIdent(column)} >= $${paramIndex}`;
      case 'lte':
        return `${quoteIdent(column)} <= $${paramIndex}`;
      default:
        throw new Error(`Unsupported filter operator: ${operator}`);
    }
  };

  return `(${splitTopLevel(input).map(buildNode).join(' OR ')})`;
}

class QueryBuilder implements PromiseLike<QueryResponse> {
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null = null;
  private selectColumns = '*';
  private returningColumns: string | null = null;
  private filters: string[] = [];
  private filterParams: any[] = [];
  private orderBy: string[] = [];
  private limitValue: number | null = null;
  private payload: any = null;
  private maybeSingleMode = false;
  private singleMode = false;
  private upsertOptions?: { onConflict?: string };

  constructor(
    private readonly pool: Pool,
    private readonly table: string
  ) {}

  select(columns = '*') {
    if (this.operation && this.operation !== 'select') {
      this.returningColumns = columns;
      return this;
    }
    this.operation = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this.operation = 'upsert';
    this.payload = payload;
    this.upsertOptions = options;
    return this;
  }

  eq(column: string, value: any) {
    return this.addFilter(column, '=', value);
  }

  gt(column: string, value: any) {
    return this.addFilter(column, '>', value);
  }

  gte(column: string, value: any) {
    return this.addFilter(column, '>=', value);
  }

  lte(column: string, value: any) {
    return this.addFilter(column, '<=', value);
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push(`${quoteIdent(column)} ${options?.ascending === false ? 'DESC' : 'ASC'}`);
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  or(expression: string) {
    this.filters.push(parseOrExpression(expression, this.filterParams));
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private addFilter(column: string, operator: FilterOperator, value: any) {
    this.filterParams.push(value);
    this.filters.push(`${quoteIdent(column)} ${operator} $${this.filterParams.length}`);
    return this;
  }

  private async execute(): Promise<QueryResponse> {
    try {
      const result = await this.run();
      return { data: result, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: { message: error?.message ?? 'Database error' },
      };
    }
  }

  private async run() {
    switch (this.operation) {
      case 'select':
        return this.runSelect();
      case 'insert':
        return this.runInsert();
      case 'update':
        return this.runUpdate();
      case 'delete':
        return this.runDelete();
      case 'upsert':
        return this.runUpsert();
      default:
        throw new Error(`No operation selected for table ${this.table}`);
    }
  }

  private buildWhereClause(startIndex = 1) {
    if (this.filters.length === 0) return { clause: '', params: this.filterParams };

    const clause = this.filters
      .map((filter) => filter.replace(/\$(\d+)/g, (_, value) => `$${Number(value) + startIndex - 1}`))
      .join(' AND ');

    return { clause: ` WHERE ${clause}`, params: this.filterParams };
  }

  private async runSelect() {
    const { baseColumns, relation } = normalizeColumns(this.selectColumns);
    let sql = `SELECT ${buildColumnList(baseColumns)} FROM ${tableRef(this.table)}`;
    const { clause, params } = this.buildWhereClause();
    sql += clause;
    if (this.orderBy.length > 0) sql += ` ORDER BY ${this.orderBy.join(', ')}`;
    if (this.limitValue != null) sql += ` LIMIT ${this.limitValue}`;

    const { rows } = await this.pool.query(sql, params);
    const hydrated = relation ? await this.hydrateRelation(rows, relation) : rows;
    return this.finalizeResult(hydrated);
  }

  private async hydrateRelation(rows: any[], relation: { alias: string; column: string; table: string }) {
    const ids = [...new Set(rows.map((row) => row[relation.column]).filter(Boolean))];
    if (ids.length === 0) {
      return rows.map((row) => ({ ...row, [relation.alias]: null }));
    }

    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    const { rows: relatedRows } = await this.pool.query(
      `SELECT * FROM ${tableRef(relation.table)} WHERE ${quoteIdent('id')} IN (${placeholders})`,
      ids
    );

    const relatedMap = new Map(relatedRows.map((row) => [row.id, row]));
    return rows.map((row) => ({
      ...row,
      [relation.alias]: relatedMap.get(row[relation.column]) ?? null,
    }));
  }

  private async runInsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
    if (rows.length === 0) return this.finalizeResult([]);

    const columns = Object.keys(rows[0]);
    const values: any[] = [];
    const groups = rows.map((row) => {
      const placeholders = columns.map((column) => {
        values.push(row[column] ?? null);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    let sql = `INSERT INTO ${tableRef(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${groups.join(', ')}`;
    if (this.returningColumns) sql += ` RETURNING ${buildColumnList(this.returningColumns)}`;
    const { rows: resultRows } = await this.pool.query(sql, values);
    return this.returningColumns ? this.finalizeResult(resultRows) : null;
  }

  private async runUpdate() {
    const entries = Object.entries(this.payload ?? {});
    if (entries.length === 0) return this.finalizeResult([]);

    const values = entries.map(([, value]) => value ?? null);
    const setClause = entries.map(([column], index) => `${quoteIdent(column)} = $${index + 1}`).join(', ');
    const { clause, params } = this.buildWhereClause(values.length + 1);
    let sql = `UPDATE ${tableRef(this.table)} SET ${setClause}${clause}`;
    if (this.returningColumns) sql += ` RETURNING ${buildColumnList(this.returningColumns)}`;
    const { rows } = await this.pool.query(sql, [...values, ...params]);
    return this.returningColumns ? this.finalizeResult(rows) : null;
  }

  private async runDelete() {
    const { clause, params } = this.buildWhereClause();
    await this.pool.query(`DELETE FROM ${tableRef(this.table)}${clause}`, params);
    return null;
  }

  private async runUpsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
    if (rows.length === 0) return this.finalizeResult([]);

    const columns = Object.keys(rows[0]);
    const values: any[] = [];
    const groups = rows.map((row) => {
      const placeholders = columns.map((column) => {
        values.push(row[column] ?? null);
        return `$${values.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    const conflictColumns = this.upsertOptions?.onConflict
      ? this.upsertOptions.onConflict.split(',').map((part) => part.trim()).filter(Boolean)
      : DEFAULT_CONFLICT_COLUMNS[this.table];

    if (!conflictColumns || conflictColumns.length === 0) {
      throw new Error(`No conflict columns configured for upsert on ${this.table}`);
    }

    const updates = columns
      .filter((column) => !conflictColumns.includes(column))
      .map((column) => `${quoteIdent(column)} = EXCLUDED.${quoteIdent(column)}`);

    let sql = `INSERT INTO ${tableRef(this.table)} (${columns.map(quoteIdent).join(', ')}) VALUES ${groups.join(', ')} `;
    sql += `ON CONFLICT (${conflictColumns.map(quoteIdent).join(', ')}) `;
    sql += updates.length > 0 ? `DO UPDATE SET ${updates.join(', ')}` : 'DO NOTHING';
    if (this.returningColumns) sql += ` RETURNING ${buildColumnList(this.returningColumns)}`;

    const { rows: resultRows } = await this.pool.query(sql, values);
    return this.returningColumns ? this.finalizeResult(resultRows) : null;
  }

  private finalizeResult(rows: any[] | null) {
    if (rows == null) return null;
    if (this.singleMode) {
      if (rows.length !== 1) throw new Error(`Expected a single row from ${this.table}, got ${rows.length}`);
      return rows[0];
    }
    if (this.maybeSingleMode) {
      return rows[0] ?? null;
    }
    return rows;
  }
}

export function createPostgresAdapter(pool: Pool) {
  return {
    from(table: string) {
      return new QueryBuilder(pool, table);
    },
  };
}
