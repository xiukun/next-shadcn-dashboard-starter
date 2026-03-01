import { create } from 'zustand';
import type {
  ColumnConfig,
  DataGridResult,
  EditCell,
  GroupState,
  RowKey,
  SortState,
  SubmissionState
} from '@maita-table/core';
import type { DataGridQuery } from '@maita-table/core';
import type { DataGridStoreState } from './types';
import { createViewSlice, type ViewSlice } from './slices/viewSlice';
import { createRuntimeSlice, type RuntimeSlice } from './slices/runtimeSlice';
import { createDataSlice, type DataSlice } from './slices/dataSlice';
import {
  createPaginationSlice,
  type PaginationSlice
} from './slices/paginationSlice';

/**
 * DataGrid Store 类型
 */
export type DataGridStore<Row = any> = ReturnType<
  typeof createDataGridStore<Row>
>;

/**
 * 创建 DataGrid Store 的初始状态
 */
export function createInitialState<Row = any>(
  columns: ColumnConfig<Row>[],
  initialData?: Partial<
    Omit<DataGridStoreState<Row>, 'view'> & {
      view: Partial<Omit<DataGridStoreState<Row>['view'], 'columns'>>;
    }
  >
): DataGridStoreState<Row> {
  return {
    view: {
      columns,
      sort: [],
      filters: [],
      groupBy: [],
      density: 'comfortable',
      columnsOrder: undefined,
      columnsWidth: undefined,
      columnsVisibility: undefined,
      columnsPinned: undefined,
      ...initialData?.view
    },
    runtime: {
      loading: false,
      selection: new Set<RowKey>(),
      expandedRowKeys: new Set<RowKey>(),
      editingCell: undefined,
      editingDraftValues: {},
      validationErrors: {},
      scrollTop: 0,
      scrollLeft: 0,
      pendingEdits: [],
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {},
      ...initialData?.runtime
    },
    data: {
      rows: [],
      totalCount: undefined,
      ...initialData?.data
    },
    pagination: {
      pageIndex: 0,
      pageSize: 10,
      pageCount: undefined,
      rowCount: undefined,
      ...initialData?.pagination
    }
  };
}

/**
 * 创建 DataGrid Store
 */
export function createDataGridStore<Row = any>(
  initialState: DataGridStoreState<Row>
) {
  return create<
    DataGridStoreState<Row> &
      ViewSlice<Row> &
      RuntimeSlice<Row> &
      DataSlice<Row> &
      PaginationSlice
  >()((...a) => ({
    ...initialState,
    ...createViewSlice(...a),
    ...createRuntimeSlice(...a),
    ...createDataSlice(...a),
    ...createPaginationSlice(...a)
  }));
}

// 导出类型
export type { DataGridStoreState } from './types';
export type { ViewSlice } from './slices/viewSlice';
export type { RuntimeSlice } from './slices/runtimeSlice';
export type { DataSlice } from './slices/dataSlice';
export type { PaginationSlice } from './slices/paginationSlice';
