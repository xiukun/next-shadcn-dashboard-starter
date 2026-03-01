'use client';

import { useCallback, useMemo } from 'react';
import type { SortState } from '@maita-table/core';
import type { DataGridStore } from '../store';

export type SortDirection = 'asc' | 'desc' | null;

export interface UseColumnSortingOptions<Row> {
  store: DataGridStore<Row>;
  /**
   * 是否启用多列排序（默认 false）
   */
  enableMultiSort?: boolean;
}

export interface UseColumnSortingResult {
  /**
   * 获取列的排序方向
   */
  getSortDirection: (columnId: string) => SortDirection;
  /**
   * 获取列的排序优先级（多列排序时）
   */
  getSortPriority: (columnId: string) => number | undefined;
  /**
   * 切换列的排序状态
   * @param columnId 列 ID
   * @param event 鼠标事件（用于检测 Ctrl/Cmd 键）
   */
  toggleSort: (columnId: string, event?: React.MouseEvent) => void;
  /**
   * 清除所有排序
   */
  clearSort: () => void;
  /**
   * 获取当前排序状态
   */
  getSortState: () => SortState;
}

export function useColumnSorting<Row>(
  options: UseColumnSortingOptions<Row>
): UseColumnSortingResult {
  const { store, enableMultiSort = false } = options;

  const getSortState = useCallback((): SortState => {
    return store.getState().view.sort || [];
  }, [store]);

  const getSortDirection = useCallback(
    (columnId: string): SortDirection => {
      const sortState = getSortState();
      const sortItem = sortState.find((s) => s.id === columnId);
      if (!sortItem) return null;
      return sortItem.desc ? 'desc' : 'asc';
    },
    [getSortState]
  );

  const getSortPriority = useCallback(
    (columnId: string): number | undefined => {
      if (!enableMultiSort) return undefined;
      const sortState = getSortState();
      const index = sortState.findIndex((s) => s.id === columnId);
      return index >= 0 ? index + 1 : undefined;
    },
    [enableMultiSort, getSortState]
  );

  const toggleSort = useCallback(
    (columnId: string, event?: React.MouseEvent) => {
      const currentSort = store.getState().view.sort || [];
      const currentIndex = currentSort.findIndex((s) => s.id === columnId);
      const isMultiSort = enableMultiSort && (event?.ctrlKey || event?.metaKey);

      let nextSort: SortState;

      if (currentIndex >= 0) {
        const currentItem = currentSort[currentIndex]!;
        // 已排序：升序 -> 降序 -> 取消
        if (currentItem.desc === false) {
          // 升序 -> 降序
          nextSort = currentSort.map((s, i) =>
            i === currentIndex ? { ...s, desc: true } : s
          );
        } else {
          // 降序 -> 取消（移除）
          if (isMultiSort) {
            // 多列排序：只移除当前列
            nextSort = currentSort.filter((_, i) => i !== currentIndex);
          } else {
            // 单列排序：清除所有排序
            nextSort = [];
          }
        }
      } else {
        // 未排序 -> 升序
        if (isMultiSort) {
          // 多列排序：添加到末尾
          nextSort = [...currentSort, { id: columnId, desc: false }];
        } else {
          // 单列排序：替换所有排序
          nextSort = [{ id: columnId, desc: false }];
        }
      }

      store.getState().setSort(nextSort);
    },
    [store, enableMultiSort]
  );

  const clearSort = useCallback(() => {
    store.getState().setSort([]);
  }, [store]);

  return {
    getSortDirection,
    getSortPriority,
    toggleSort,
    clearSort,
    getSortState
  };
}
