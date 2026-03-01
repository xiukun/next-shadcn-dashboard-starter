import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnFiltering } from '../../src/hooks/useColumnFiltering';
import type { ReactDataGridStore } from '../../src/store';
import type { DataGridControllerState, FilterState } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
  age: number;
  status: string;
}

function createMockStore(
  initialFilters: FilterState = []
): ReactDataGridStore<Row> {
  let state: DataGridControllerState<Row> = {
    view: {
      columns: [],
      sort: [],
      filters: initialFilters,
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
        if (nextState.view.filters) {
          state.view.filters = nextState.view.filters;
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

describe('useColumnFiltering', () => {
  let store: ReactDataGridStore<Row>;

  beforeEach(() => {
    store = createMockStore();
  });

  describe('初始状态', () => {
    it('应该初始化时没有过滤条件', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.getFilterValue('name')).toBeUndefined();
      expect(result.current.getFilterOperator('name')).toBeUndefined();
      expect(result.current.getFilterState()).toEqual([]);
    });
  });

  describe('setFilter', () => {
    it('应该设置文本过滤条件', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'contains', 'John');
      });

      expect(result.current.hasFilter('name')).toBe(true);
      expect(result.current.getFilterValue('name')).toBe('John');
      expect(result.current.getFilterOperator('name')).toBe('contains');
      expect(result.current.getFilterState()).toEqual([
        { id: 'name', op: 'contains', value: 'John' }
      ]);
    });

    it('应该设置数字过滤条件', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('age', 'gt', 18);
      });

      expect(result.current.hasFilter('age')).toBe(true);
      expect(result.current.getFilterValue('age')).toBe(18);
      expect(result.current.getFilterOperator('age')).toBe('gt');
    });

    it('应该更新已存在的过滤条件', () => {
      store = createMockStore([{ id: 'name', op: 'contains', value: 'John' }]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'startsWith', 'Jane');
      });

      expect(result.current.getFilterValue('name')).toBe('Jane');
      expect(result.current.getFilterOperator('name')).toBe('startsWith');
      expect(result.current.getFilterState()).toEqual([
        { id: 'name', op: 'startsWith', value: 'Jane' }
      ]);
    });

    it('应该支持多个列的过滤条件', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'contains', 'John');
        result.current.setFilter('age', 'gt', 18);
        result.current.setFilter('status', 'eq', 'active');
      });

      expect(result.current.hasFilter('name')).toBe(true);
      expect(result.current.hasFilter('age')).toBe(true);
      expect(result.current.hasFilter('status')).toBe(true);
      expect(result.current.getFilterState()).toHaveLength(3);
    });

    it('应该清除过滤条件当值为空字符串时', () => {
      store = createMockStore([{ id: 'name', op: 'contains', value: 'John' }]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'contains', '');
      });

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.getFilterState()).toEqual([]);
    });

    it('应该清除过滤条件当值为 null 时', () => {
      store = createMockStore([{ id: 'name', op: 'contains', value: 'John' }]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'contains', null);
      });

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.getFilterState()).toEqual([]);
    });

    it('应该清除过滤条件当值为 undefined 时', () => {
      store = createMockStore([{ id: 'name', op: 'contains', value: 'John' }]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('name', 'contains', undefined);
      });

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.getFilterState()).toEqual([]);
    });
  });

  describe('clearFilter', () => {
    it('应该清除单个列的过滤条件', () => {
      store = createMockStore([
        { id: 'name', op: 'contains', value: 'John' },
        { id: 'age', op: 'gt', value: 18 }
      ]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.clearFilter('name');
      });

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.hasFilter('age')).toBe(true);
      expect(result.current.getFilterState()).toEqual([
        { id: 'age', op: 'gt', value: 18 }
      ]);
    });

    it('应该在不存在的列上也能正常工作', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.clearFilter('nonexistent');
      });

      expect(result.current.getFilterState()).toEqual([]);
    });
  });

  describe('clearAllFilters', () => {
    it('应该清除所有过滤条件', () => {
      store = createMockStore([
        { id: 'name', op: 'contains', value: 'John' },
        { id: 'age', op: 'gt', value: 18 },
        { id: 'status', op: 'eq', value: 'active' }
      ]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.hasFilter('name')).toBe(false);
      expect(result.current.hasFilter('age')).toBe(false);
      expect(result.current.hasFilter('status')).toBe(false);
      expect(result.current.getFilterState()).toEqual([]);
    });

    it('应该在空过滤状态下也能正常工作', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.clearAllFilters();
      });

      expect(result.current.getFilterState()).toEqual([]);
    });
  });

  describe('getFilterState', () => {
    it('应该返回当前过滤状态', () => {
      store = createMockStore([
        { id: 'name', op: 'contains', value: 'John' },
        { id: 'age', op: 'gt', value: 18 }
      ]);
      const { result } = renderHook(() => useColumnFiltering({ store }));

      const filterState = result.current.getFilterState();
      expect(filterState).toEqual([
        { id: 'name', op: 'contains', value: 'John' },
        { id: 'age', op: 'gt', value: 18 }
      ]);
    });

    it('应该在过滤状态变化后返回最新状态', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      expect(result.current.getFilterState()).toEqual([]);

      act(() => {
        result.current.setFilter('name', 'contains', 'John');
      });

      expect(result.current.getFilterState()).toEqual([
        { id: 'name', op: 'contains', value: 'John' }
      ]);
    });
  });

  describe('边界情况', () => {
    it('应该处理不存在的列 ID', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      expect(result.current.hasFilter('nonexistent')).toBe(false);
      expect(result.current.getFilterValue('nonexistent')).toBeUndefined();
      expect(result.current.getFilterOperator('nonexistent')).toBeUndefined();
    });

    it('应该处理空字符串列 ID', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('', 'contains', 'value');
      });

      expect(result.current.hasFilter('')).toBe(true);
      expect(result.current.getFilterValue('')).toBe('value');
    });

    it('应该处理不同类型的过滤值', () => {
      const { result } = renderHook(() => useColumnFiltering({ store }));

      act(() => {
        result.current.setFilter('age', 'gt', 18);
        result.current.setFilter('name', 'contains', 'John');
        result.current.setFilter('active', 'eq', true);
        result.current.setFilter('tags', 'in', ['tag1', 'tag2']);
      });

      expect(result.current.getFilterValue('age')).toBe(18);
      expect(result.current.getFilterValue('name')).toBe('John');
      expect(result.current.getFilterValue('active')).toBe(true);
      expect(result.current.getFilterValue('tags')).toEqual(['tag1', 'tag2']);
    });
  });
});
