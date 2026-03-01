import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnFiltering } from '../../src/hooks/useColumnFiltering';
import { createDataGridStore, createInitialState } from '../../src/store';
import type { ColumnConfig, FilterState } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
  age: number;
  status: string;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name },
  { id: 'age', header: 'Age', accessor: (row) => row.age },
  { id: 'status', header: 'Status', accessor: (row) => row.status }
];

function createMockStore(initialFilters: FilterState = []) {
  return createDataGridStore(
    createInitialState(columns, {
      view: {
        filters: initialFilters
      }
    })
  );
}

describe('useColumnFiltering', () => {
  let store: ReturnType<typeof createMockStore>;

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
