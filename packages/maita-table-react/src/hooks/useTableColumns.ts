'use client';

import { useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ColumnConfig, ColumnMeta } from '@maita-table/core';
import type { DataGridStore } from '../store';

export interface UseTableColumnsOptions<Row> {
  columns: ColumnConfig<Row>[];
  store: DataGridStore<Row>;
}

export interface UseTableColumnsResult<Row> {
  /**
   * 可见列（按固定位置分组）
   */
  visibleColumns: {
    leftPinned: ColumnConfig<Row>[];
    center: ColumnConfig<Row>[];
    rightPinned: ColumnConfig<Row>[];
    all: ColumnConfig<Row>[];
  };
  /**
   * 所有可见列的列定义（用于 TanStack Table）
   */
  columnDefs: Array<ColumnDef<Row>>;
  /**
   * 左固定列的总宽度
   */
  leftPinnedWidth: number;
  /**
   * 右固定列的总宽度
   */
  rightPinnedWidth: number;
}

/**
 * 管理列定义生成和可见列计算
 */
export function useTableColumns<Row>(
  options: UseTableColumnsOptions<Row>
): UseTableColumnsResult<Row> {
  const { columns, store } = options;

  // 订阅 view 状态变化
  const viewState = store((state) => state.view);

  // 计算实际显示的列（考虑顺序、可见性、固定位置）
  const visibleColumns = useMemo(() => {
    const order = viewState.columnsOrder || columns.map((col) => col.id);
    const visibility = viewState.columnsVisibility || {};
    const pinned = viewState.columnsPinned || {};

    // 按顺序排列，并过滤可见性
    const ordered = order
      .map((id) => columns.find((col) => col.id === id))
      .filter((col): col is ColumnConfig<Row> => {
        if (!col) return false;
        const isVisible = visibility[col.id] ?? col.visible !== false;
        return isVisible;
      });

    // 按固定位置分组
    const leftPinned = ordered.filter((col) => pinned[col.id] === 'left');
    const rightPinned = ordered.filter((col) => pinned[col.id] === 'right');
    const center = ordered.filter(
      (col) => pinned[col.id] !== 'left' && pinned[col.id] !== 'right'
    );

    return { leftPinned, center, rightPinned, all: ordered };
  }, [columns, viewState]);

  // 生成列定义的辅助函数
  const createColumnDefs = useCallback(
    (cols: ColumnConfig<Row>[]): Array<ColumnDef<Row>> => {
      return cols.map((col) => {
        const meta = (col.meta || {}) as ColumnMeta<Row, unknown>;

        const enableGrouping = meta.enableGrouping ?? col.groupable ?? true;

        const enableAggregation = meta.enableAggregation ?? false;

        return {
          id: col.id,
          header: () => col.header,
          accessorFn: (row) => col.accessor(row),
          // 是否允许该列参与分组（是否出现在 groupBy 中）
          enableGrouping,
          // 是否允许该列参与聚合（影响聚合行是否渲染该列的聚合值）
          enableAggregation,
          meta: col.meta as any
        };
      });
    },
    []
  );

  // 为三个区域分别生成列定义
  const leftColumnDefs = useMemo(
    () => createColumnDefs(visibleColumns.leftPinned),
    [visibleColumns.leftPinned, createColumnDefs]
  );
  const centerColumnDefs = useMemo(
    () => createColumnDefs(visibleColumns.center),
    [visibleColumns.center, createColumnDefs]
  );
  const rightColumnDefs = useMemo(
    () => createColumnDefs(visibleColumns.rightPinned),
    [visibleColumns.rightPinned, createColumnDefs]
  );

  // 合并所有列定义（用于 TanStack Table）
  const columnDefs = useMemo<Array<ColumnDef<Row>>>(() => {
    return [...leftColumnDefs, ...centerColumnDefs, ...rightColumnDefs];
  }, [leftColumnDefs, centerColumnDefs, rightColumnDefs]);

  // 计算左固定列的总宽度（用于 sticky 定位）
  const leftPinnedWidth = useMemo(() => {
    return visibleColumns.leftPinned.reduce((sum, col) => {
      const width =
        viewState.columnsWidth?.[col.id] ??
        (typeof col.width === 'number' ? col.width : 150);
      return sum + (typeof width === 'number' ? width : 150);
    }, 0);
  }, [visibleColumns.leftPinned, viewState.columnsWidth]);

  // 计算右固定列的总宽度（用于 sticky 定位）
  const rightPinnedWidth = useMemo(() => {
    return visibleColumns.rightPinned.reduce((sum, col) => {
      const width =
        viewState.columnsWidth?.[col.id] ??
        (typeof col.width === 'number' ? col.width : 150);
      return sum + (typeof width === 'number' ? width : 150);
    }, 0);
  }, [visibleColumns.rightPinned, viewState.columnsWidth]);

  return {
    visibleColumns,
    columnDefs,
    leftPinnedWidth,
    rightPinnedWidth
  };
}
