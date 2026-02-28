import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTableSubmission } from '../../src/hooks/useTableSubmission';
import type { ReactDataGridStore } from '../../src/store';
import type { ColumnConfig } from '@maita-table/core';
import type { DataGridControllerState } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
  price: number;
}

function createMockStore(): ReactDataGridStore<Row> {
  const state: DataGridControllerState<Row> = {
    view: {
      columns: [],
      sort: [],
      filters: [],
      globalSearch: undefined,
      groupBy: [],
      paginationMode: 'page',
      pageIndex: 0,
      pageSize: 20,
      density: 'comfortable'
    },
    runtime: {
      loading: false,
      selection: new Set(),
      expandedRowKeys: new Set(),
      editingDraftValues: {},
      validationErrors: {},
      scrollTop: 0,
      scrollLeft: 0,
      pendingEdits: [
        {
          rowKey: '1',
          rowIndex: 0,
          originalRow: { id: 1, name: 'Product 1', price: 100 },
          editedRow: { name: 'New Name' },
          timestamp: Date.now()
        }
      ],
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {}
    },
    data: {
      rows: [{ id: 1, name: 'Product 1', price: 100 }],
      totalRowCount: 1
    }
  };

  return {
    getState: () => state,
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    controller: {
      buildQuery: vi.fn(),
      reduce: vi.fn((s) => s)
    },
    dispatch: vi.fn()
  } as any;
}

describe('useTableSubmission', () => {
  let mockStore: ReactDataGridStore<Row>;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStore = createMockStore();
    mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  });

  it('should provide submitRow function', () => {
    const columns: ColumnConfig<Row>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true }
      }
    ];

    const { result } = renderHook(() =>
      useTableSubmission({
        store: mockStore,
        columns,
        onSubmit: mockOnSubmit
      })
    );

    expect(result.current.submitRow).toBeDefined();
    expect(typeof result.current.submitRow).toBe('function');
  });

  it('should provide submitBatch function', () => {
    const columns: ColumnConfig<Row>[] = [];

    const { result } = renderHook(() =>
      useTableSubmission({
        store: mockStore,
        columns,
        onSubmit: mockOnSubmit
      })
    );

    expect(result.current.submitBatch).toBeDefined();
    expect(typeof result.current.submitBatch).toBe('function');
  });

  it('should validate row before submission', async () => {
    const columns: ColumnConfig<Row>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true, editable: true }
      }
    ];

    // 创建一个新的 store，其中 pendingEdit 将 name 设置为空字符串（验证失败）
    const invalidStore = createMockStore();
    const invalidState = invalidStore.getState();
    invalidState.runtime.pendingEdits = [
      {
        rowKey: '1',
        rowIndex: 0,
        originalRow: { id: 1, name: 'Product 1', price: 100 },
        editedRow: { name: '' }, // 空字符串，验证应该失败
        timestamp: Date.now()
      }
    ];

    const { result } = renderHook(() =>
      useTableSubmission({
        store: invalidStore,
        columns,
        onSubmit: mockOnSubmit
      })
    );

    await result.current.submitRow('1');

    // 应该没有调用 onSubmit，因为验证失败（空字符串不满足 required）
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit row when validation passes', async () => {
    const columns: ColumnConfig<Row>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true }
      }
    ];

    const { result } = renderHook(() =>
      useTableSubmission({
        store: mockStore,
        columns,
        onSubmit: mockOnSubmit
      })
    );

    await result.current.submitRow('1');

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith([
      { rowKey: '1', row: { id: 1, name: 'New Name', price: 100 } }
    ]);
  });
});
