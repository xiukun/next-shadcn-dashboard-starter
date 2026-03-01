import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnSorting } from '../../src/hooks/useColumnSorting';
import type { ReactDataGridStore } from '../../src/store';
import type { DataGridControllerState } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
  age: number;
}

function createMockStore(
  initialSort: Array<{ id: string; desc: boolean }> = []
): ReactDataGridStore<Row> {
  let state: DataGridControllerState<Row> = {
    view: {
      columns: [],
      sort: initialSort,
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
      pendingEdits: [],
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {}
    },
    data: {
      rows: [],
      totalRowCount: 0
    }
  };

  const subscribers: Array<(state: DataGridControllerState<Row>) => void> = [];

  return {
    getState: () => state,
    setState: (updater) => {
      const nextState =
        typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...nextState };
      // Deep merge for nested objects
      if (nextState.view) {
        state.view = { ...state.view, ...nextState.view };
        if (nextState.view.sort) {
          state.view.sort = nextState.view.sort;
        }
      }
      // Notify subscribers
      subscribers.forEach((sub) => sub(state));
    },
    subscribe: (listener) => {
      subscribers.push(listener);
      return () => {
        const index = subscribers.indexOf(listener);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      };
    },
    dispatch: vi.fn(),
    controller: {} as any
  } as unknown as ReactDataGridStore<Row>;
}

describe('useColumnSorting', () => {
  let store: ReactDataGridStore<Row>;

  beforeEach(() => {
    store = createMockStore();
  });

  describe('单列排序模式（enableMultiSort = false）', () => {
    it('应该初始化时没有排序', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortPriority('name')).toBeUndefined();
      expect(result.current.getSortState()).toEqual([]);
    });

    it('应该从未排序切换到升序', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.getSortDirection('name')).toBe('asc');
      expect(result.current.getSortPriority('name')).toBeUndefined();
      expect(result.current.getSortState()).toEqual([
        { id: 'name', desc: false }
      ]);
    });

    it('应该从升序切换到降序', () => {
      store = createMockStore([{ id: 'name', desc: false }]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.getSortDirection('name')).toBe('desc');
      expect(result.current.getSortState()).toEqual([
        { id: 'name', desc: true }
      ]);
    });

    it('应该从降序切换到取消排序', () => {
      store = createMockStore([{ id: 'name', desc: true }]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortState()).toEqual([]);
    });

    it('应该切换列时清除之前的排序', () => {
      store = createMockStore([{ id: 'name', desc: false }]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.toggleSort('age');
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortDirection('age')).toBe('asc');
      expect(result.current.getSortState()).toEqual([
        { id: 'age', desc: false }
      ]);
    });
  });

  describe('多列排序模式（enableMultiSort = true）', () => {
    it('应该支持添加多个排序列', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      // 第一次点击：添加 name 列（升序）
      act(() => {
        const mockEvent = {
          ctrlKey: true
        } as React.MouseEvent;
        result.current.toggleSort('name', mockEvent);
      });

      expect(result.current.getSortDirection('name')).toBe('asc');
      expect(result.current.getSortPriority('name')).toBe(1);
      expect(result.current.getSortState()).toEqual([
        { id: 'name', desc: false }
      ]);

      // 第二次点击（Ctrl + 点击）：添加 age 列（升序）
      act(() => {
        const mockEvent = {
          ctrlKey: true
        } as React.MouseEvent;
        result.current.toggleSort('age', mockEvent);
      });

      expect(result.current.getSortDirection('name')).toBe('asc');
      expect(result.current.getSortPriority('name')).toBe(1);
      expect(result.current.getSortDirection('age')).toBe('asc');
      expect(result.current.getSortPriority('age')).toBe(2);
      expect(result.current.getSortState()).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: false }
      ]);
    });

    it('应该支持 Cmd 键（Mac）', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      act(() => {
        const mockEvent = {
          metaKey: true
        } as React.MouseEvent;
        result.current.toggleSort('name', mockEvent);
      });

      expect(result.current.getSortDirection('name')).toBe('asc');
      expect(result.current.getSortPriority('name')).toBe(1);
    });

    it('应该在没有 Ctrl/Cmd 键时替换所有排序', () => {
      store = createMockStore([
        { id: 'name', desc: false },
        { id: 'age', desc: false }
      ]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      // 不使用 Ctrl/Cmd 键，应该替换所有排序
      act(() => {
        result.current.toggleSort('id');
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortDirection('age')).toBe(null);
      expect(result.current.getSortDirection('id')).toBe('asc');
      expect(result.current.getSortState()).toEqual([
        { id: 'id', desc: false }
      ]);
    });

    it('应该在多列排序中移除单个列', () => {
      store = createMockStore([
        { id: 'name', desc: false },
        { id: 'age', desc: false }
      ]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      // 将 name 列从升序切换到降序
      act(() => {
        const mockEvent = {
          ctrlKey: true
        } as React.MouseEvent;
        result.current.toggleSort('name', mockEvent);
      });

      expect(result.current.getSortDirection('name')).toBe('desc');
      expect(result.current.getSortPriority('name')).toBe(1);
      expect(result.current.getSortPriority('age')).toBe(2);

      // 再次点击 name 列（降序 -> 移除）
      act(() => {
        const mockEvent = {
          ctrlKey: true
        } as React.MouseEvent;
        result.current.toggleSort('name', mockEvent);
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortPriority('name')).toBeUndefined();
      expect(result.current.getSortDirection('age')).toBe('asc');
      expect(result.current.getSortPriority('age')).toBe(1); // 优先级重新计算
      expect(result.current.getSortState()).toEqual([
        { id: 'age', desc: false }
      ]);
    });

    it('应该正确显示排序优先级', () => {
      store = createMockStore([
        { id: 'name', desc: false },
        { id: 'age', desc: true },
        { id: 'id', desc: false }
      ]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      expect(result.current.getSortPriority('name')).toBe(1);
      expect(result.current.getSortPriority('age')).toBe(2);
      expect(result.current.getSortPriority('id')).toBe(3);
      expect(result.current.getSortPriority('nonexistent')).toBeUndefined();
    });
  });

  describe('clearSort', () => {
    it('应该清除所有排序', () => {
      store = createMockStore([
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortDirection('age')).toBe(null);
      expect(result.current.getSortState()).toEqual([]);
    });

    it('应该在空排序状态下也能正常工作', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.clearSort();
      });

      expect(result.current.getSortState()).toEqual([]);
    });
  });

  describe('getSortState', () => {
    it('应该返回当前排序状态', () => {
      store = createMockStore([
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      const sortState = result.current.getSortState();
      expect(sortState).toEqual([
        { id: 'name', desc: false },
        { id: 'age', desc: true }
      ]);
    });

    it('应该在排序状态变化后返回最新状态', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      expect(result.current.getSortState()).toEqual([]);

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.getSortState()).toEqual([
        { id: 'name', desc: false }
      ]);
    });
  });

  describe('边界情况', () => {
    it('应该处理不存在的列 ID', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      expect(result.current.getSortDirection('nonexistent')).toBe(null);
      expect(result.current.getSortPriority('nonexistent')).toBeUndefined();
    });

    it('应该处理空字符串列 ID', () => {
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: false })
      );

      act(() => {
        result.current.toggleSort('');
      });

      expect(result.current.getSortDirection('')).toBe('asc');
      expect(result.current.getSortState()).toEqual([{ id: '', desc: false }]);
    });

    it('应该在没有事件对象时使用单列排序模式', () => {
      store = createMockStore([{ id: 'name', desc: false }]);
      const { result } = renderHook(() =>
        useColumnSorting({ store, enableMultiSort: true })
      );

      // 即使 enableMultiSort = true，但没有事件对象，应该替换所有排序
      act(() => {
        result.current.toggleSort('age');
      });

      expect(result.current.getSortDirection('name')).toBe(null);
      expect(result.current.getSortDirection('age')).toBe('asc');
      expect(result.current.getSortState()).toEqual([
        { id: 'age', desc: false }
      ]);
    });
  });
});
