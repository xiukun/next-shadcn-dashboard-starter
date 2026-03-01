import type { StateCreator } from 'zustand';
import type {
  ColumnConfig,
  DataGridResult,
  EditCell,
  GroupState,
  PendingEdit,
  RowKey,
  SortState,
  SubmissionState
} from '@maita-table/core';
import type { DataGridQuery } from '@maita-table/core';

/**
 * DataGrid Store 状态结构
 */
export interface DataGridStoreState<Row = any> {
  // === View State (视图状态) ===
  view: {
    columns: ColumnConfig<Row>[];
    sort: SortState;
    filters: DataGridQuery['filters'];
    globalSearch?: string;
    groupBy: GroupState;
    density: 'comfortable' | 'compact';
    columnsOrder?: string[];
    columnsWidth?: Record<string, number>;
    columnsVisibility?: Record<string, boolean>;
    columnsPinned?: Record<string, 'left' | 'right'>;
  };

  // === Runtime State (运行时状态) ===
  runtime: {
    loading: boolean;
    selection: Set<RowKey>;
    expandedRowKeys: Set<RowKey>;
    editingCell?: EditCell;
    editingDraftValues: Record<string, unknown>;
    validationErrors: Record<string, string>;
    scrollTop: number;
    scrollLeft: number;
    pendingEdits: PendingEdit<Row>[];
    submission: SubmissionState;
    rowValidationErrors: Record<string, string[]>;
  };

  // === Data State (数据状态) ===
  data: {
    rows: Row[];
    totalCount?: number;
  };

  // === Pagination State (分页状态) ===
  pagination: {
    pageIndex: number;
    pageSize: number;
    pageCount?: number;
    rowCount?: number;
  };
}

/**
 * Zustand Store Creator 类型
 */
export type DataGridStoreCreator<Row = any> = StateCreator<
  DataGridStoreState<Row>,
  [],
  [],
  DataGridStoreState<Row>
>;
