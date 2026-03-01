'use client';

import { useEffect, useCallback } from 'react';
import type { DataGridStore } from '../store';

export interface PaginationPersistenceConfig {
  gridId: string;
  enabled?: boolean;
  store: DataGridStore<any>;
}

const STORAGE_KEY_PREFIX = 'grid-pagination-';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export function usePaginationPersistence(config: PaginationPersistenceConfig) {
  const { gridId, enabled = true, store } = config;

  const storageKey = `${STORAGE_KEY_PREFIX}${gridId}`;

  const loadPagination = useCallback((): PaginationState | null => {
    if (!enabled || typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as PaginationState;
      // 验证数据格式
      if (
        typeof parsed.pageIndex === 'number' &&
        typeof parsed.pageSize === 'number' &&
        parsed.pageIndex >= 0 &&
        parsed.pageSize > 0
      ) {
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn(
        `[maita-table] Failed to load pagination state for grid "${gridId}":`,
        error
      );
      return null;
    }
  }, [gridId, storageKey, enabled]);

  const savePagination = useCallback(
    (state: PaginationState) => {
      if (!enabled || typeof window === 'undefined') {
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn(
          `[maita-table] Failed to save pagination state for grid "${gridId}":`,
          error
        );
      }
    },
    [gridId, storageKey, enabled]
  );

  const clearPagination = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(
        `[maita-table] Failed to clear pagination state for grid "${gridId}":`,
        error
      );
    }
  }, [gridId, storageKey, enabled]);

  // 恢复分页状态（仅在初始化时执行一次）
  useEffect(() => {
    if (!enabled) return;

    const saved = loadPagination();
    if (!saved) return;

    const current = store.getState();
    // 仅在状态与保存的不同时才更新，避免不必要的更新
    if (
      current.pagination.pageIndex !== saved.pageIndex ||
      current.pagination.pageSize !== saved.pageSize
    ) {
      // setPageSize 会重置 pageIndex 为 0，所以先设置 pageSize，再设置 pageIndex
      current.setPageSize(saved.pageSize);
      current.setPageIndex(saved.pageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在组件挂载时执行一次

  // 监听分页状态变化并保存
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = store.subscribe((state) => {
      savePagination({
        pageIndex: state.pagination.pageIndex,
        pageSize: state.pagination.pageSize
      });
    });

    return unsubscribe;
  }, [store, enabled, savePagination]);

  return {
    loadPagination,
    savePagination,
    clearPagination
  };
}
