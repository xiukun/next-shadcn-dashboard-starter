import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnSorting } from '../../src/hooks/useColumnSorting';
import { createDataGridStore, createInitialState } from '../../src/store';
import type { ColumnConfig } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
  age: number;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name },
  { id: 'age', header: 'Age', accessor: (row) => row.age }
];

function createMockStore(
  initialSort: Array<{ id: string; desc: boolean }> = []
) {
  return createDataGridStore(
    createInitialState(columns, {
      view: {
        sort: initialSort
      }
    })
  );
}

describe('useColumnSorting', () => {
  let store: ReturnType<typeof createMockStore>;

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
      store = createMockStore([{ id: 'name', desc: true }] as any);
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
      store = createMockStore([{ id: 'name', desc: false }] as any);
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
      ] as any);
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
