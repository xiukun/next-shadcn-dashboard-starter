import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaginationPersistence } from '../../src/hooks/usePaginationPersistence';
import { createDataGridStore, createInitialState } from '../../src/store';
import type { ColumnConfig } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name }
];

describe('usePaginationPersistence', () => {
  const gridId = 'test-grid';
  const storageKey = `grid-pagination-${gridId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('loadPagination', () => {
    it('should load pagination state from localStorage on mount', async () => {
      const store = createDataGridStore(createInitialState(columns));
      const savedState = { pageIndex: 3, pageSize: 20 };
      localStorage.setItem(storageKey, JSON.stringify(savedState));

      renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      // Wait for useEffect to load the state
      await waitFor(
        () => {
          const state = store.getState();
          expect(state.pagination.pageIndex).toBe(3);
          expect(state.pagination.pageSize).toBe(20);
        },
        { timeout: 1000 }
      );
    });

    it('should return null when localStorage is empty', () => {
      const store = createDataGridStore(createInitialState(columns));
      const { result } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      const loaded = result.current.loadPagination();
      expect(loaded).toBeNull();
    });

    it('should return null when disabled', () => {
      const store = createDataGridStore(createInitialState(columns));
      const { result } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: false,
          store
        })
      );

      const loaded = result.current.loadPagination();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const store = createDataGridStore(createInitialState(columns));
      localStorage.setItem(storageKey, 'invalid-json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      const loaded = result.current.loadPagination();
      expect(loaded).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should validate pagination state format', () => {
      const store = createDataGridStore(createInitialState(columns));
      localStorage.setItem(
        storageKey,
        JSON.stringify({ pageIndex: -1, pageSize: 0 })
      );

      const { result } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      const loaded = result.current.loadPagination();
      expect(loaded).toBeNull();
    });
  });

  describe('savePagination', () => {
    it('should save pagination state to localStorage', async () => {
      const store = createDataGridStore(createInitialState(columns));
      renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      // Wait for hook to set up subscription
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // setPageSize 会重置 pageIndex 为 0，所以先设置 pageSize，再设置 pageIndex
      act(() => {
        store.getState().setPageSize(25);
        store.getState().setPageIndex(2);
      });

      // Wait for subscription callback to save
      await waitFor(
        () => {
          const saved = localStorage.getItem(storageKey);
          expect(saved).toBeTruthy();
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.pageIndex).toBe(2);
            expect(parsed.pageSize).toBe(25);
          }
        },
        { timeout: 1000 }
      );
    });

    it('should not save when disabled', () => {
      const store = createDataGridStore(createInitialState(columns));
      renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: false,
          store
        })
      );

      act(() => {
        store.getState().setPageIndex(5);
        store.getState().setPageSize(30);
      });

      const saved = localStorage.getItem(storageKey);
      expect(saved).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const store = createDataGridStore(createInitialState(columns));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      act(() => {
        store.getState().setPageIndex(1);
      });

      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('integration', () => {
    it('should persist and restore pagination state', async () => {
      const store1 = createDataGridStore(createInitialState(columns));
      const { unmount } = renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store: store1
        })
      );

      // Wait for hook to set up subscription
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // setPageSize 会重置 pageIndex 为 0，所以先设置 pageSize，再设置 pageIndex
      act(() => {
        store1.getState().setPageSize(15);
        store1.getState().setPageIndex(4);
      });

      // Wait for save to complete
      await waitFor(
        () => {
          const saved = localStorage.getItem(storageKey);
          expect(saved).toBeTruthy();
          if (saved) {
            const parsed = JSON.parse(saved);
            expect(parsed.pageIndex).toBe(4);
            expect(parsed.pageSize).toBe(15);
          }
        },
        { timeout: 1000 }
      );

      unmount();

      // Create a new store and hook instance
      const store2 = createDataGridStore(createInitialState(columns));
      renderHook(() =>
        usePaginationPersistence({
          gridId,
          enabled: true,
          store: store2
        })
      );

      // Wait for useEffect to load the state
      await waitFor(
        () => {
          const state = store2.getState();
          expect(state.pagination.pageIndex).toBe(4);
          expect(state.pagination.pageSize).toBe(15);
        },
        { timeout: 1000 }
      );
    });
  });
});
