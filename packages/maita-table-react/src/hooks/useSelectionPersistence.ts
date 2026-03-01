'use client';

import { useEffect, useCallback } from 'react';
import type { RowKey } from '@maita-table/core';
import type { ReactDataGridStore } from '../store';

export interface SelectionPersistenceConfig {
  gridId: string;
  enabled?: boolean;
  store: ReactDataGridStore<any>;
}

const STORAGE_KEY_PREFIX = 'grid-selection-';

export function useSelectionPersistence(config: SelectionPersistenceConfig) {
  const { gridId, enabled = true, store } = config;

  const storageKey = `${STORAGE_KEY_PREFIX}${gridId}`;

  const loadSelection = useCallback((): RowKey[] => {
    if (!enabled || typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored) as RowKey[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(
        `[maita-table] Failed to load selection state for grid "${gridId}":`,
        error
      );
      return [];
    }
  }, [gridId, storageKey, enabled]);

  const saveSelection = useCallback(
    (selectedRowKeys: RowKey[]) => {
      if (!enabled || typeof window === 'undefined') {
        return;
      }

      try {
        if (selectedRowKeys.length === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(selectedRowKeys));
        }
      } catch (error) {
        console.warn(
          `[maita-table] Failed to save selection state for grid "${gridId}":`,
          error
        );
      }
    },
    [gridId, storageKey, enabled]
  );

  const clearSelection = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(
        `[maita-table] Failed to clear selection state for grid "${gridId}":`,
        error
      );
    }
  }, [gridId, storageKey, enabled]);

  // 恢复选择状态（仅在初始化时执行一次）
  useEffect(() => {
    if (!enabled) return;

    const savedKeys = loadSelection();
    if (savedKeys.length === 0) return;

    const current = store.getState();
    const currentRowKeys = current.data.rows.map((row) => row.id as RowKey);

    // 仅恢复在当前数据源中仍然存在的行
    const validKeys = savedKeys.filter((key) => currentRowKeys.includes(key));

    if (validKeys.length > 0) {
      store.setState({
        ...current,
        runtime: {
          ...current.runtime,
          selection: new Set(validKeys)
        }
      });
    } else {
      // 如果没有有效的 key，清除持久化状态
      clearSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在组件挂载时执行一次

  // 监听选择状态变化并保存
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = store.subscribe((state) => {
      const selectedKeys = Array.from(state.runtime.selection);
      saveSelection(selectedKeys);
    });

    return unsubscribe;
  }, [store, enabled, saveSelection]);

  return {
    loadSelection,
    saveSelection,
    clearSelection
  };
}
