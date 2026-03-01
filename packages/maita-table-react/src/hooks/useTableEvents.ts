'use client';

import { useCallback } from 'react';
import type { DataGridStore } from '../store';

export interface UseTableEventsOptions<Row> {
  store: DataGridStore<Row>;
}

export interface UseTableEventsResult {
  /**
   * 处理列顺序变更
   */
  handleColumnsOrderChange: (order: string[]) => void;
  /**
   * 处理列宽度变更
   */
  handleColumnWidthChange: (columnId: string, width: number) => void;
  /**
   * 处理列可见性变更
   */
  handleColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  /**
   * 处理列固定位置变更
   */
  handleColumnPinnedChange: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  /**
   * 重置列状态
   */
  handleReset: () => void;
}

/**
 * 管理事件处理逻辑
 */
export function useTableEvents<Row>(
  options: UseTableEventsOptions<Row>
): UseTableEventsResult {
  const { store } = options;

  // 处理列状态变更
  const handleColumnsOrderChange = useCallback(
    (order: string[]) => {
      store.getState().setColumnsOrder(order);
    },
    [store]
  );

  const handleColumnWidthChange = useCallback(
    (columnId: string, width: number) => {
      store.getState().setColumnWidth(columnId, width);
    },
    [store]
  );

  const handleColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      store.getState().setColumnVisibility(columnId, visible);
    },
    [store]
  );

  const handleColumnPinnedChange = useCallback(
    (columnId: string, pinned: 'left' | 'right' | undefined) => {
      store.getState().setColumnPinned(columnId, pinned);
    },
    [store]
  );

  const handleReset = useCallback(() => {
    // 重置列状态需要在组件层面处理，因为需要清除持久化
    // 这里只提供一个占位函数
  }, []);

  return {
    handleColumnsOrderChange,
    handleColumnWidthChange,
    handleColumnVisibilityChange,
    handleColumnPinnedChange,
    handleReset
  };
}
