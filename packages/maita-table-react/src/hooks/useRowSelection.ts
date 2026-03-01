'use client';

import { useCallback, useMemo } from 'react';
import type { RowKey } from '@maita-table/core';
import type { ReactDataGridStore } from '../store';

export type SelectionMode = 'single' | 'multiple';

export interface UseRowSelectionOptions<Row> {
  store: ReactDataGridStore<Row>;
  selectionMode?: SelectionMode;
  selectedRowKeys?: RowKey[];
  onSelectionChange?: (selectedRowKeys: RowKey[]) => void;
}

export interface UseRowSelectionResult {
  selectedRowKeys: Set<RowKey>;
  isSelected: (rowKey: RowKey) => boolean;
  toggleRow: (rowKey: RowKey) => void;
  selectRow: (rowKey: RowKey) => void;
  deselectRow: (rowKey: RowKey) => void;
  selectRange: (
    startRowKey: RowKey,
    endRowKey: RowKey,
    allRowKeys: RowKey[]
  ) => void;
  selectAll: (allRowKeys: RowKey[]) => void;
  deselectAll: () => void;
  getSelectedCount: () => number;
  /**
   * 获取指定 key 集合中已选中的数量（常用于“当前页”的全选计算）
   */
  getSelectedCountForKeys: (keys: RowKey[]) => number;
  /**
   * 批量选择指定的行
   */
  selectKeys: (keys: RowKey[]) => void;
  /**
   * 批量取消选择指定的行
   */
  deselectKeys: (keys: RowKey[]) => void;
}

export function useRowSelection<Row>(
  options: UseRowSelectionOptions<Row>
): UseRowSelectionResult {
  const {
    store,
    selectionMode = 'multiple',
    selectedRowKeys: controlledSelectedRowKeys,
    onSelectionChange
  } = options;

  const state = store.getState();
  const selection = state.runtime.selection;

  // 如果使用受控模式，使用外部传入的 selectedRowKeys
  const selectedRowKeys = useMemo(() => {
    if (controlledSelectedRowKeys) {
      return new Set(controlledSelectedRowKeys);
    }
    return selection;
  }, [controlledSelectedRowKeys, selection]);

  const notifySelectionChange = useCallback(
    (newSelection: Set<RowKey>) => {
      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      }
    },
    [onSelectionChange]
  );

  const updateSelection = useCallback(
    (newSelection: Set<RowKey>) => {
      const current = store.getState();
      store.setState({
        ...current,
        runtime: {
          ...current.runtime,
          selection: newSelection
        }
      });
      notifySelectionChange(newSelection);
    },
    [store, notifySelectionChange]
  );

  const isSelected = useCallback(
    (rowKey: RowKey) => {
      return selectedRowKeys.has(rowKey);
    },
    [selectedRowKeys]
  );

  const toggleRow = useCallback(
    (rowKey: RowKey) => {
      const newSelection = new Set(selectedRowKeys);
      if (newSelection.has(rowKey)) {
        newSelection.delete(rowKey);
      } else {
        if (selectionMode === 'single') {
          // 单选模式：清除之前的选择
          newSelection.clear();
        }
        newSelection.add(rowKey);
      }
      updateSelection(newSelection);
    },
    [selectedRowKeys, selectionMode, updateSelection]
  );

  const selectRow = useCallback(
    (rowKey: RowKey) => {
      const newSelection = new Set(selectedRowKeys);
      if (selectionMode === 'single') {
        newSelection.clear();
      }
      newSelection.add(rowKey);
      updateSelection(newSelection);
    },
    [selectedRowKeys, selectionMode, updateSelection]
  );

  const deselectRow = useCallback(
    (rowKey: RowKey) => {
      const newSelection = new Set(selectedRowKeys);
      newSelection.delete(rowKey);
      updateSelection(newSelection);
    },
    [selectedRowKeys, updateSelection]
  );

  const selectRange = useCallback(
    (startRowKey: RowKey, endRowKey: RowKey, allRowKeys: RowKey[]) => {
      const startIndex = allRowKeys.indexOf(startRowKey);
      const endIndex = allRowKeys.indexOf(endRowKey);

      if (startIndex === -1 || endIndex === -1) {
        return;
      }

      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const rangeKeys = allRowKeys.slice(minIndex, maxIndex + 1);

      const newSelection = new Set(selectedRowKeys);
      if (selectionMode === 'single') {
        // 单选模式：只选择范围的第一个
        newSelection.clear();
        if (rangeKeys.length > 0) {
          newSelection.add(rangeKeys[0]!);
        }
      } else {
        // 多选模式：选择整个范围
        rangeKeys.forEach((key) => {
          newSelection.add(key);
        });
      }
      updateSelection(newSelection);
    },
    [selectedRowKeys, selectionMode, updateSelection]
  );

  const selectAll = useCallback(
    (allRowKeys: RowKey[]) => {
      // 统一走 selectKeys，避免重复实现逻辑
      if (selectionMode === 'single') {
        // 单选模式：只选择第一个
        const first = allRowKeys[0];
        const next = new Set<RowKey>();
        if (first !== undefined) {
          next.add(first);
        }
        updateSelection(next);
        return;
      }

      // 多选模式：选择所有传入的 keys
      const base = new Set(selectedRowKeys);
      allRowKeys.forEach((key) => {
        base.add(key);
      });
      updateSelection(base);
    },
    [selectedRowKeys, selectionMode, updateSelection]
  );

  const deselectAll = useCallback(() => {
    const newSelection = new Set<RowKey>();
    updateSelection(newSelection);
  }, [updateSelection]);

  const getSelectedCountForKeys = useCallback(
    (keys: RowKey[]) => {
      if (!keys.length || selectedRowKeys.size === 0) return 0;
      let count = 0;
      for (const key of keys) {
        if (selectedRowKeys.has(key)) {
          count++;
        }
      }
      return count;
    },
    [selectedRowKeys]
  );

  const selectKeys = useCallback(
    (keys: RowKey[]) => {
      if (keys.length === 0) return;

      if (selectionMode === 'single') {
        const next = new Set<RowKey>();
        const first = keys[0];
        if (first !== undefined) {
          next.add(first);
        }
        updateSelection(next);
        return;
      }

      const next = new Set(selectedRowKeys);
      keys.forEach((key) => {
        next.add(key);
      });
      updateSelection(next);
    },
    [selectedRowKeys, selectionMode, updateSelection]
  );

  const deselectKeys = useCallback(
    (keys: RowKey[]) => {
      if (keys.length === 0) return;
      if (selectedRowKeys.size === 0) return;

      const next = new Set(selectedRowKeys);
      keys.forEach((key) => {
        next.delete(key);
      });
      updateSelection(next);
    },
    [selectedRowKeys, updateSelection]
  );

  const getSelectedCount = useCallback(() => {
    return selectedRowKeys.size;
  }, [selectedRowKeys]);

  return {
    selectedRowKeys,
    isSelected,
    toggleRow,
    selectRow,
    deselectRow,
    selectRange,
    selectAll,
    deselectAll,
    getSelectedCount,
    getSelectedCountForKeys,
    selectKeys,
    deselectKeys
  };
}
