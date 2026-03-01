'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { Row } from '@tanstack/react-table';
import type { RowKey } from '@maita-table/core';
import type { UseRowSelectionResult } from './useRowSelection';

export interface UseDataGridSelectionOptions<Row> {
  /**
   * 是否启用行选择
   */
  enableRowSelection: boolean;
  /**
   * 行选择功能对象（来自 useRowSelection hook）
   */
  selection: UseRowSelectionResult;
  /**
   * 当前页所有行的 key
   */
  currentPageRowKeys: RowKey[];
}

export interface UseDataGridSelectionResult {
  /**
   * 处理行选择切换（支持 Shift+Click 范围选择）
   */
  handleRowToggle: (rowKey: RowKey, event?: React.MouseEvent) => void;
  /**
   * 处理全选/取消全选
   */
  handleToggleAll: () => void;
}

/**
 * 管理 DataGrid 的行选择逻辑（包括范围选择）
 */
export function useDataGridSelection<Row>(
  options: UseDataGridSelectionOptions<Row>
): UseDataGridSelectionResult {
  const { enableRowSelection, selection, currentPageRowKeys } = options;

  // 记录上次选中的行（用于范围选择）
  const lastSelectedRowKeyRef = useRef<RowKey | null>(null);

  // 处理行选择（支持 Shift+Click 范围选择）
  const handleRowToggle = useCallback(
    (rowKey: RowKey, event?: React.MouseEvent) => {
      if (!enableRowSelection) return;

      const isShiftClick = event?.shiftKey ?? false;

      if (isShiftClick && lastSelectedRowKeyRef.current !== null) {
        // 范围选择
        selection.selectRange(
          lastSelectedRowKeyRef.current,
          rowKey,
          currentPageRowKeys
        );
      } else {
        // 普通选择
        selection.toggleRow(rowKey);
        lastSelectedRowKeyRef.current = rowKey;
      }
    },
    [enableRowSelection, selection, currentPageRowKeys]
  );

  // 处理全选
  const handleToggleAll = useCallback(() => {
    if (!enableRowSelection) return;

    const totalCount = currentPageRowKeys.length;
    if (totalCount === 0) return;

    const selectedOnPage =
      selection.getSelectedCountForKeys(currentPageRowKeys);

    if (selectedOnPage === totalCount) {
      // 当前页已全部选中 → 一次性取消当前页所有选择
      selection.deselectKeys(currentPageRowKeys);
    } else {
      // 当前页未全部选中 → 一次性选中当前页所有行
      selection.selectKeys(currentPageRowKeys);
    }
  }, [enableRowSelection, selection, currentPageRowKeys]);

  return {
    handleRowToggle,
    handleToggleAll
  };
}
