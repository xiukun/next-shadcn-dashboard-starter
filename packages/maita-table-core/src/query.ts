export type SortState = Array<{ id: string; desc: boolean }>;

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'in'
  | 'between'
  | (string & {});

export type FilterState = Array<{
  id: string;
  op: FilterOperator;
  value: unknown;
}>;

export type GroupState = string[];

export type PaginationMode = 'page' | 'infinite' | 'none';

export interface DataGridQuery {
  page?: { index: number; size: number };
  sort?: SortState;
  filters?: FilterState;
  globalSearch?: string;
  groupBy?: GroupState;
  extra?: Record<string, unknown>;
}

export interface DataGridResult<Row> {
  rows: Row[];
  totalRowCount?: number;
  hasMore?: boolean;
  stats?: Record<string, unknown>;
  version?: string | number;
}

export interface DataSource<Row> {
  fetch(
    query: DataGridQuery,
    signal?: AbortSignal
  ): Promise<DataGridResult<Row>>;
}
