'use client';

import { useCallback } from 'react';
import type { ColumnConfig, ColumnMeta } from '@maita-table/core';
import type { Table } from '@tanstack/react-table';

export interface UseEditableCellNavigationOptions<Row> {
  table: Table<Row>;
  visibleColumns: ColumnConfig<Row>[];
}

/**
 * 可编辑单元格导航 hook
 * 查找下一个/上一个可编辑单元格的索引
 */
export function useEditableCellNavigation<Row>(
  options: UseEditableCellNavigationOptions<Row>
) {
  const { table, visibleColumns } = options;

  const findNextEditableCellIndex = useCallback(
    (
      direction: 'next' | 'prev',
      rowIndex: number,
      columnIndex: number
    ): { rowIndex: number; columnIndex: number } | null => {
      const rows = table.getRowModel().rows;
      const rowCount = rows.length;
      const colCount = visibleColumns.length;

      let r = rowIndex;
      let c = columnIndex;

      for (let steps = 0; steps < rowCount * colCount; steps++) {
        if (direction === 'next') {
          c++;
          if (c >= colCount) {
            c = 0;
            r++;
            if (r >= rowCount) return null;
          }
        } else {
          c--;
          if (c < 0) {
            c = colCount - 1;
            r--;
            if (r < 0) return null;
          }
        }

        const nextColumn = visibleColumns[c];
        const meta = nextColumn.meta as ColumnMeta<Row> | undefined;
        if (meta?.editable) {
          return { rowIndex: r, columnIndex: c };
        }
      }

      return null;
    },
    [table, visibleColumns]
  );

  return { findNextEditableCellIndex };
}
