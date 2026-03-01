'use client';

import { useCallback, useMemo } from 'react';
import type { FilterState, FilterOperator } from '@maita-table/core';
import type { DataGridStore } from '../store';

export interface UseColumnFilteringOptions<Row> {
  store: DataGridStore<Row>;
}

export interface UseColumnFilteringResult {
  /**
   * 获取列的过滤值
   */
  getFilterValue: (columnId: string) => unknown;
  /**
   * 获取列的过滤操作符
   */
  getFilterOperator: (columnId: string) => FilterOperator | undefined;
  /**
   * 检查列是否有过滤条件
   */
  hasFilter: (columnId: string) => boolean;
  /**
   * 设置列的过滤条件
   * @param columnId 列 ID
   * @param operator 过滤操作符
   * @param value 过滤值
   */
  setFilter: (
    columnId: string,
    operator: FilterOperator,
    value: unknown
  ) => void;
  /**
   * 清除列的过滤条件
   */
  clearFilter: (columnId: string) => void;
  /**
   * 清除所有过滤条件
   */
  clearAllFilters: () => void;
  /**
   * 获取当前过滤状态
   */
  getFilterState: () => FilterState;
}

export function useColumnFiltering<Row>(
  options: UseColumnFilteringOptions<Row>
): UseColumnFilteringResult {
  const { store } = options;

  const getFilterState = useCallback((): FilterState => {
    const state = store.getState();
    return state.view.filters || [];
  }, [store]);

  const getFilterValue = useCallback(
    (columnId: string): unknown => {
      const filterState = getFilterState();
      const filterItem = filterState.find((f) => f.id === columnId);
      return filterItem?.value;
    },
    [getFilterState]
  );

  const getFilterOperator = useCallback(
    (columnId: string): FilterOperator | undefined => {
      const filterState = getFilterState();
      const filterItem = filterState.find((f) => f.id === columnId);
      return filterItem?.op;
    },
    [getFilterState]
  );

  const hasFilter = useCallback(
    (columnId: string): boolean => {
      const filterState = getFilterState();
      return filterState.some((f) => f.id === columnId);
    },
    [getFilterState]
  );

  const setFilter = useCallback(
    (columnId: string, operator: FilterOperator, value: unknown) => {
      const currentFilters = store.getState().view.filters || [];
      const existingIndex = currentFilters.findIndex((f) => f.id === columnId);

      let nextFilters: FilterState;

      if (value === null || value === undefined || value === '') {
        // 空值：移除过滤条件
        if (existingIndex >= 0) {
          nextFilters = currentFilters.filter((_, i) => i !== existingIndex);
        } else {
          nextFilters = currentFilters;
        }
      } else {
        // 有值：添加或更新过滤条件
        const newFilter = { id: columnId, op: operator, value };
        if (existingIndex >= 0) {
          nextFilters = currentFilters.map((f, i) =>
            i === existingIndex ? newFilter : f
          );
        } else {
          nextFilters = [...currentFilters, newFilter];
        }
      }

      store.getState().setFilters(nextFilters);
    },
    [store]
  );

  const clearFilter = useCallback(
    (columnId: string) => {
      const currentFilters = store.getState().view.filters || [];
      const nextFilters = currentFilters.filter((f) => f.id !== columnId);
      store.getState().setFilters(nextFilters);
    },
    [store]
  );

  const clearAllFilters = useCallback(() => {
    store.getState().setFilters([]);
  }, [store]);

  return {
    getFilterValue,
    getFilterOperator,
    hasFilter,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilterState
  };
}
