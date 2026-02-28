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

export interface PendingEdit<Row = any> {
  rowKey: string;
  rowIndex: number;
  originalRow: Row;
  editedRow: Partial<Row>;
  timestamp: number;
}

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  submittedRows: string[]; // rowKeys
  failedRows: Array<{
    rowKey: string;
    error: string;
  }>;
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
  /**
   * 列顺序（覆盖 columns 的顺序）
   */
  columnsOrder?: string[];
  /**
   * 列宽度映射（columnId -> width）
   */
  columnsWidth?: Record<string, number>;
  /**
   * 列可见性映射（columnId -> visible）
   */
  columnsVisibility?: Record<string, boolean>;
  /**
   * 列固定位置映射（columnId -> 'left' | 'right'）
   */
  columnsPinned?: Record<string, 'left' | 'right'>;
}

export interface DataGridRuntimeState<Row = any> {
  loading: boolean;
  selection: Set<RowKey>;
  expandedRowKeys: Set<RowKey>;
  editingCell?: EditCell;
  /**
   * 暂存编辑中的单元格值，key 形如 `${rowKey}:${columnId}`
   */
  editingDraftValues: Record<string, unknown>;
  validationErrors: Record<string, string>;
  scrollTop: number;
  scrollLeft: number;
  /**
   * 待提交的编辑记录
   */
  pendingEdits: PendingEdit<Row>[];
  /**
   * 提交状态
   */
  submission: SubmissionState;
  /**
   * 行级验证错误，key 为 rowKey
   */
  rowValidationErrors: Record<string, string[]>;
}

export interface DataGridControllerState<Row = any> {
  view: DataGridViewState<Row>;
  runtime: DataGridRuntimeState<Row>;
  data: DataGridResult<Row>;
}
