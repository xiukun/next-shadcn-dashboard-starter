'use client';

import { useCallback } from 'react';
import type { ColumnConfig } from '@maita-table/core';
import type { Table } from '@tanstack/react-table';

export interface UseColumnResizeOptions<Row> {
  columns: ColumnConfig<Row>[];
  table: Table<Row>;
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  onColumnWidthChange: (columnId: string, width: number) => void;
}

/**
 * 列宽自动调整 hook
 * 根据表头和单元格内容自动计算并设置列宽
 */
export function useColumnResize<Row>(options: UseColumnResizeOptions<Row>) {
  const { columns, table, virtualItems, onColumnWidthChange } = options;

  const handleColumnResize = useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return;

      // 测量表头宽度
      const headerElement = document.querySelector(
        `th[data-column-id="${columnId}"]`
      ) as HTMLElement;
      const headerWidth = headerElement?.offsetWidth || 0;

      // 测量当前可见行的内容宽度
      let maxCellWidth = 0;
      const visibleRows = virtualItems.slice(
        0,
        Math.min(20, virtualItems.length)
      );

      visibleRows.forEach((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index];
        if (!row) return;

        const cell = row
          .getVisibleCells()
          .find((c) => c.column.id === columnId);
        if (!cell) return;

        // 创建临时元素测量文本宽度
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.fontSize = window.getComputedStyle(
          headerElement || document.body
        ).fontSize;
        tempDiv.style.fontFamily = window.getComputedStyle(
          headerElement || document.body
        ).fontFamily;
        tempDiv.textContent = String(cell.getValue() ?? '');
        document.body.appendChild(tempDiv);
        const cellWidth = tempDiv.offsetWidth;
        document.body.removeChild(tempDiv);

        maxCellWidth = Math.max(maxCellWidth, cellWidth);
      });

      // 计算新宽度
      const padding = 24;
      const newWidth = Math.max(headerWidth, maxCellWidth) + padding;
      const minWidth = column.minWidth ?? 50;
      const maxWidth = column.maxWidth ?? 1000;
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      onColumnWidthChange(columnId, finalWidth);
    },
    [columns, virtualItems, table, onColumnWidthChange]
  );

  return { handleColumnResize };
}
