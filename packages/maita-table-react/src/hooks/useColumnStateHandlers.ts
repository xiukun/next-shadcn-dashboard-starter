'use client';

import { useCallback } from 'react';
import type { ColumnConfig } from '@maita-table/core';
import type { DataGridStore } from '../store';
import type { UseTableEventsResult } from './useTableEvents';
import type { ColumnState } from './useColumnPersistence';

export interface UseColumnStateHandlersOptions<Row> {
  store: DataGridStore<Row>;
  columns: ColumnConfig<Row>[];
  events: UseTableEventsResult;
  saveColumnState: (state: ColumnState) => void;
  clearColumnState: () => void;
}

export interface UseColumnStateHandlersResult {
  handleColumnsOrderChange: (order: string[]) => void;
  handleColumnWidthChange: (columnId: string, width: number) => void;
  handleColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  handleColumnPinnedChange: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  handleReset: () => void;
}

/**
 * 统一处理列状态变更的 hook
 * 包括列顺序、宽度、可见性、固定等状态变更，并自动处理持久化
 */
export function useColumnStateHandlers<Row>(
  options: UseColumnStateHandlersOptions<Row>
): UseColumnStateHandlersResult {
  const { store, columns, events, saveColumnState, clearColumnState } = options;

  const handleColumnsOrderChange = useCallback(
    (order: string[]) => {
      events.handleColumnsOrderChange(order);
      const current = store.getState();
      saveColumnState({
        columnsOrder: order,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: current.view.columnsPinned
      });
    },
    [events, store, saveColumnState]
  );

  const handleColumnWidthChange = useCallback(
    (columnId: string, width: number) => {
      events.handleColumnWidthChange(columnId, width);
      const current = store.getState();
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: {
          ...current.view.columnsWidth,
          [columnId]: width
        },
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: current.view.columnsPinned
      });
    },
    [events, store, saveColumnState]
  );

  const handleColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      events.handleColumnVisibilityChange(columnId, visible);
      const current = store.getState();
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: {
          ...current.view.columnsVisibility,
          [columnId]: visible
        },
        columnsPinned: current.view.columnsPinned
      });
    },
    [events, store, saveColumnState]
  );

  const handleColumnPinnedChange = useCallback(
    (columnId: string, pinned: 'left' | 'right' | undefined) => {
      events.handleColumnPinnedChange(columnId, pinned);
      const current = store.getState();
      const nextColumnsPinned = { ...current.view.columnsPinned };
      if (pinned) {
        nextColumnsPinned[columnId] = pinned;
      } else if (pinned === undefined && nextColumnsPinned) {
        delete nextColumnsPinned[columnId];
      }
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: nextColumnsPinned
      });
    },
    [events, store, saveColumnState]
  );

  const handleReset = useCallback(() => {
    const current = store.getState();
    current.setColumnsOrder(columns.map((col) => col.id));
    // 清除其他列状态
    // 重置列宽度：设置为默认值（使用列定义中的默认宽度或 150）
    Object.keys(current.view.columnsWidth || {}).forEach((colId) => {
      const column = columns.find((col) => col.id === colId);
      const defaultWidth =
        typeof column?.width === 'number' ? column.width : 150;
      current.setColumnWidth(colId, defaultWidth);
    });
    Object.keys(current.view.columnsVisibility || {}).forEach((colId) => {
      current.setColumnVisibility(colId, true);
    });
    Object.keys(current.view.columnsPinned || {}).forEach((colId) => {
      current.setColumnPinned(colId, undefined);
    });
    clearColumnState();
  }, [store, columns, clearColumnState]);

  return {
    handleColumnsOrderChange,
    handleColumnWidthChange,
    handleColumnVisibilityChange,
    handleColumnPinnedChange,
    handleReset
  };
}
