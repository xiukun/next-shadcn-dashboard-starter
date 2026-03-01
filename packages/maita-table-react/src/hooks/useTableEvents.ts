'use client';

import { useCallback } from 'react';
import type { RowKey } from '@maita-table/core';
import type { DataGridStore } from '../store';

export interface UseTableEventsOptions<Row> {
  store: DataGridStore<Row>;
  /**
   * 是否启用行选择（默认 true）
   */
  enableRowSelection?: boolean;
}

export interface UseTableEventsResult {
  /**
   * 处理行选择切换（支持 Shift+Click 范围选择）
   */
  handleRowToggle: (
    rowKey: RowKey,
    event?: React.MouseEvent,
    allRowKeys?: RowKey[]
  ) => void;
  /**
   * 处理全选
   */
  handleToggleAll: (allRowKeys: RowKey[]) => void;
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
  const { store, enableRowSelection = true } = options;

  // 记录上次选中的行（用于范围选择）
  const lastSelectedRowKeyRef = useCallback(() => {
    const state = store.getState();
    const selection = Array.from(state.runtime.selection);
    return selection.length > 0 ? selection[selection.length - 1] : null;
  }, [store]);

  // 处理行选择（支持 Shift+Click 范围选择）
  const handleRowToggle = useCallback(
    (rowKey: RowKey, event?: React.MouseEvent, allRowKeys?: RowKey[]) => {
      if (!enableRowSelection) return;

      const isShiftClick = event?.shiftKey ?? false;
      const lastSelected = lastSelectedRowKeyRef();

      if (isShiftClick && lastSelected !== null && allRowKeys) {
        // 范围选择
        store.getState().selectRange(lastSelected, rowKey, allRowKeys);
      } else {
        // 普通选择
        store.getState().toggleRowSelection(rowKey);
      }
    },
    [enableRowSelection, store, lastSelectedRowKeyRef]
  );

  // 处理全选
  const handleToggleAll = useCallback(
    (allRowKeys: RowKey[]) => {
      if (!enableRowSelection) return;

      const totalCount = allRowKeys.length;
      if (totalCount === 0) return;

      const state = store.getState();
      const selectedCount = allRowKeys.filter((key) =>
        state.runtime.selection.has(key)
      ).length;

      if (selectedCount === totalCount) {
        // 当前页已全部选中 → 一次性取消当前页所有选择
        store.getState().deselectKeys(allRowKeys);
      } else {
        // 当前页未全部选中 → 一次性选中当前页所有行
        store.getState().selectKeys(allRowKeys);
      }
    },
    [enableRowSelection, store]
  );

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
    handleRowToggle,
    handleToggleAll,
    handleColumnsOrderChange,
    handleColumnWidthChange,
    handleColumnVisibilityChange,
    handleColumnPinnedChange,
    handleReset
  };
}
