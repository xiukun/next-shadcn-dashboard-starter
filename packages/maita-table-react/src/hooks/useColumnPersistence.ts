import { useEffect, useCallback } from 'react';
import type { DataGridViewState } from '@maita-table/core';

export interface ColumnPersistenceConfig {
  gridId: string;
  enabled?: boolean;
}

export interface ColumnState {
  columnsOrder?: string[];
  columnsWidth?: Record<string, number>;
  columnsVisibility?: Record<string, boolean>;
  columnsPinned?: Record<string, 'left' | 'right'>;
}

const STORAGE_KEY_PREFIX = 'grid-columns-';

export function useColumnPersistence(config: ColumnPersistenceConfig) {
  const { gridId, enabled = true } = config;

  const storageKey = `${STORAGE_KEY_PREFIX}${gridId}`;

  const loadColumnState = useCallback((): ColumnState | null => {
    if (!enabled || typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as ColumnState;
      return parsed;
    } catch (error) {
      console.warn(
        `[maita-table] Failed to load column state for grid "${gridId}":`,
        error
      );
      return null;
    }
  }, [gridId, storageKey, enabled]);

  const saveColumnState = useCallback(
    (state: ColumnState) => {
      if (!enabled || typeof window === 'undefined') {
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn(
          `[maita-table] Failed to save column state for grid "${gridId}":`,
          error
        );
      }
    },
    [gridId, storageKey, enabled]
  );

  const clearColumnState = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(
        `[maita-table] Failed to clear column state for grid "${gridId}":`,
        error
      );
    }
  }, [gridId, storageKey, enabled]);

  return {
    loadColumnState,
    saveColumnState,
    clearColumnState
  };
}
