'use client';

import { useCallback } from 'react';
import type { DataGridStore } from '../store';

export interface UseTableInteractionOptions<Row> {
  store: DataGridStore<Row>;
}

/**
 * 表格交互处理 hook
 * 处理表格的点击、编辑取消等交互逻辑
 */
export function useTableInteraction<Row>(
  options: UseTableInteractionOptions<Row>
) {
  const { store } = options;

  const handleTbodyClick = useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      if (e.target === e.currentTarget) {
        const current = store.getState();
        if (current.runtime.editingCell) {
          current.cancelEditing(current.runtime.editingCell);
        }
      }
    },
    [store]
  );

  return { handleTbodyClick };
}
