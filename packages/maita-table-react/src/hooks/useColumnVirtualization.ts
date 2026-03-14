import { useMemo } from 'react';
import type { ColumnConfig } from '@maita-table/core';

export interface ColumnVirtualizationOptions {
  columns: ColumnConfig[];
  columnsWidth?: Record<string, number>;
  columnsPinned?: Record<string, 'left' | 'right' | undefined>;
  scrollLeft: number;
  containerWidth: number;
  defaultColumnWidth?: number;
  overscan?: number;
  /**
   * 选择列宽度（如果启用行选择）
   */
  selectionColumnWidth?: number;
}

export interface VirtualColumn {
  column: ColumnConfig;
  index: number;
  start: number;
  end: number;
  width: number;
  /**
   * 是否为固定列
   */
  pinned?: 'left' | 'right';
}

export interface ColumnVirtualizationResult {
  /**
   * 左固定列（始终可见）
   */
  leftPinnedColumns: VirtualColumn[];
  /**
   * 虚拟化的中间列（可见 + overscan）
   */
  virtualColumns: VirtualColumn[];
  /**
   * 右固定列（始终可见）
   */
  rightPinnedColumns: VirtualColumn[];
  /**
   * 所有列的列表（用于渲染）
   */
  allColumns: VirtualColumn[];
  /**
   * 总宽度
   */
  totalWidth: number;
  /**
   * 中间列区域的起始偏移量（用于 padding-left）
   */
  startOffset: number;
  /**
   * 中间列区域的结束偏移量（用于 padding-right）
   */
  endOffset: number;
}

const DEFAULT_COLUMN_WIDTH = 150;
const DEFAULT_OVERSCAN = 2;

export function useColumnVirtualization(
  options: ColumnVirtualizationOptions
): ColumnVirtualizationResult {
  const {
    columns,
    columnsWidth = {},
    columnsPinned = {},
    scrollLeft,
    containerWidth,
    defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
    overscan = DEFAULT_OVERSCAN
  } = options;

  return useMemo(() => {
    // 计算每列的宽度和累积偏移量
    const columnOffsets: Array<{
      column: ColumnConfig;
      index: number;
      start: number;
      width: number;
      pinned?: 'left' | 'right';
    }> = [];

    let currentOffset = 0;

    columns.forEach((column, index) => {
      const width =
        columnsWidth[column.id] ??
        (typeof column.width === 'number' ? column.width : defaultColumnWidth);
      const pinned = columnsPinned[column.id];

      columnOffsets.push({
        column,
        index,
        start: currentOffset,
        width,
        pinned
      });

      currentOffset += width;
    });

    const totalWidth = currentOffset;

    // 分离固定列和普通列
    const leftPinnedColumns: VirtualColumn[] = [];
    const rightPinnedColumns: VirtualColumn[] = [];
    const regularColumns: Array<{
      column: ColumnConfig;
      index: number;
      start: number;
      width: number;
    }> = [];

    columnOffsets.forEach((offset) => {
      const virtualColumn: VirtualColumn = {
        column: offset.column,
        index: offset.index,
        start: offset.start,
        end: offset.start + offset.width,
        width: offset.width,
        pinned: offset.pinned
      };

      if (offset.pinned === 'left') {
        leftPinnedColumns.push(virtualColumn);
      } else if (offset.pinned === 'right') {
        rightPinnedColumns.push(virtualColumn);
      } else {
        regularColumns.push(offset);
      }
    });

    // 计算可见列范围（仅针对普通列）
    const viewportStart = scrollLeft;
    const viewportEnd = scrollLeft + containerWidth;

    // 添加 overscan
    const overscanStart = Math.max(
      0,
      viewportStart - overscan * defaultColumnWidth
    );
    const overscanEnd = viewportEnd + overscan * defaultColumnWidth;

    // 找到可见列的起始和结束索引
    let startIndex = 0;
    let endIndex = regularColumns.length - 1;

    for (let i = 0; i < regularColumns.length; i++) {
      const offset = regularColumns[i]!;
      if (offset.start + offset.width >= overscanStart) {
        startIndex = Math.max(0, i - 1);
        break;
      }
    }

    for (let i = regularColumns.length - 1; i >= 0; i--) {
      const offset = regularColumns[i]!;
      if (offset.start <= overscanEnd) {
        endIndex = Math.min(regularColumns.length - 1, i + 1);
        break;
      }
    }

    // 生成虚拟列（仅普通列）
    const virtualColumns: VirtualColumn[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const offset = regularColumns[i];
      if (offset) {
        virtualColumns.push({
          column: offset.column,
          index: offset.index,
          start: offset.start,
          end: offset.start + offset.width,
          width: offset.width
        });
      }
    }

    // 计算前后填充偏移量
    const startOffset =
      startIndex > 0 && regularColumns[startIndex]
        ? regularColumns[startIndex]!.start
        : 0;
    const endOffset =
      endIndex < regularColumns.length - 1 && regularColumns[endIndex]
        ? totalWidth -
          (regularColumns[endIndex]!.start + regularColumns[endIndex]!.width)
        : 0;

    // 生成所有列的列表
    const allColumns: VirtualColumn[] = [
      ...leftPinnedColumns,
      ...virtualColumns,
      ...rightPinnedColumns
    ];

    return {
      leftPinnedColumns,
      virtualColumns,
      rightPinnedColumns,
      allColumns,
      totalWidth,
      startOffset,
      endOffset
    };
  }, [
    columns,
    columnsWidth,
    columnsPinned,
    scrollLeft,
    containerWidth,
    defaultColumnWidth,
    overscan
  ]);
}
