import { useMemo } from 'react';
import type { ColumnConfig } from '@maita-table/core';

export interface ColumnVirtualizationOptions {
  columns: ColumnConfig[];
  columnsWidth?: Record<string, number>;
  scrollLeft: number;
  containerWidth: number;
  defaultColumnWidth?: number;
  overscan?: number;
}

export interface VirtualColumn {
  column: ColumnConfig;
  index: number;
  start: number;
  end: number;
  width: number;
}

export interface ColumnVirtualizationResult {
  virtualColumns: VirtualColumn[];
  totalWidth: number;
  startOffset: number;
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
    }> = [];

    let currentOffset = 0;

    columns.forEach((column, index) => {
      const width =
        columnsWidth[column.id] ??
        (typeof column.width === 'number' ? column.width : defaultColumnWidth);

      columnOffsets.push({
        column,
        index,
        start: currentOffset,
        width
      });

      currentOffset += width;
    });

    const totalWidth = currentOffset;

    // 计算可见列范围
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
    let endIndex = columns.length - 1;

    for (let i = 0; i < columnOffsets.length; i++) {
      const offset = columnOffsets[i]!;
      if (offset.start + offset.width >= overscanStart) {
        startIndex = Math.max(0, i - 1);
        break;
      }
    }

    for (let i = columnOffsets.length - 1; i >= 0; i--) {
      const offset = columnOffsets[i]!;
      if (offset.start <= overscanEnd) {
        endIndex = Math.min(columns.length - 1, i + 1);
        break;
      }
    }

    // 生成虚拟列
    const virtualColumns: VirtualColumn[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const offset = columnOffsets[i];
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
    const startOffset = startIndex > 0 ? columnOffsets[startIndex]!.start : 0;
    const endOffset =
      endIndex < columnOffsets.length - 1
        ? totalWidth - columnOffsets[endIndex]!.end
        : 0;

    return {
      virtualColumns,
      totalWidth,
      startOffset,
      endOffset
    };
  }, [
    columns,
    columnsWidth,
    scrollLeft,
    containerWidth,
    defaultColumnWidth,
    overscan
  ]);
}
