import type { ColumnConfig } from './column';
import type {
  DataGridQuery,
  DataGridResult,
  GroupState,
  SortState
} from './query';

export type DataGridId = string;
export type RowKey = string | number;

export interface EditCell {
  rowKey: RowKey;
  columnId: string;
}

export interface DataGridViewState<Row = any> {
  columns: ColumnConfig<Row>[];
  sort: SortState;
  filters: DataGridQuery['filters'];
  globalSearch?: string;
  groupBy: GroupState;
  paginationMode: 'page' | 'infinite' | 'none';
  pageIndex: number;
  pageSize: number;
  density: 'comfortable' | 'compact';
}

export interface DataGridRuntimeState<Row = any> {
  loading: boolean;
  selection: Set<RowKey>;
  expandedRowKeys: Set<RowKey>;
  editingCell?: EditCell;
  validationErrors: Record<string, string>;
  scrollTop: number;
  scrollLeft: number;
}

export interface DataGridControllerState<Row = any> {
  view: DataGridViewState<Row>;
  runtime: DataGridRuntimeState<Row>;
  data: DataGridResult<Row>;
}
