import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSelectionPersistence } from '../../src/hooks/useSelectionPersistence';
import { createDataGridStore, createInitialState } from '../../src/store';
import type { ColumnConfig, RowKey } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name }
];

function createMockStore(initialSelection: RowKey[] = []) {
  return createDataGridStore(
    createInitialState(columns, {
      runtime: {
        selection: new Set(initialSelection)
      },
      data: {
        rows: [
          { id: 1, name: 'Row 1' },
          { id: 2, name: 'Row 2' },
          { id: 3, name: 'Row 3' }
        ],
        totalCount: 3
      }
    })
  );
}

describe('useSelectionPersistence', () => {
  const gridId = 'test-grid';
  const storageKey = `grid-selection-${gridId}`;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('save and load selection', () => {
    it('should save selection to localStorage', async () => {
      const store = createMockStore();
      const { result } = renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      // Update selection
      act(() => {
        store.getState().setSelection(new Set<RowKey>(['1', '2']));
      });

      await waitFor(() => {
        const stored = localStorage.getItem(storageKey);
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toEqual(['1', '2']);
      });
    });

    it('should load selection from localStorage on mount', async () => {
      // Pre-populate localStorage (row ids are numbers, but stored as strings)
      localStorage.setItem(storageKey, JSON.stringify([1, 2]));

      const store = createMockStore();

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      await waitFor(() => {
        const state = store.getState();
        const selection = Array.from(state.runtime.selection);
        // Row ids are numbers, so selection should contain numbers
        expect(selection).toContain(1);
        expect(selection).toContain(2);
        expect(selection.length).toBe(2);
      });
    });

    it('should clear localStorage when selection is empty', async () => {
      const store = createMockStore(['1', '2']);
      localStorage.setItem(storageKey, JSON.stringify(['1', '2']));

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      // Clear selection
      act(() => {
        store.getState().clearSelection();
      });

      await waitFor(() => {
        expect(localStorage.getItem(storageKey)).toBeNull();
      });
    });

    it('should only restore valid row keys that exist in data', async () => {
      // Pre-populate localStorage with keys that don't all exist
      // Row ids are numbers, so use numbers in localStorage
      localStorage.setItem(storageKey, JSON.stringify([1, 999, 2]));

      const store = createMockStore();

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      await waitFor(() => {
        const state = store.getState();
        const restoredKeys = Array.from(state.runtime.selection);
        // Only 1 and 2 should be restored (they exist in data)
        expect(restoredKeys).toContain(1);
        expect(restoredKeys).toContain(2);
        expect(restoredKeys).not.toContain(999);
        expect(restoredKeys.length).toBe(2);
      });
    });

    it('should clear localStorage if no valid keys are found', async () => {
      // Pre-populate localStorage with keys that don't exist
      localStorage.setItem(storageKey, JSON.stringify(['999', '1000']));

      const store = createMockStore();

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      await waitFor(() => {
        // Should clear localStorage since no valid keys
        expect(localStorage.getItem(storageKey)).toBeNull();
      });
    });
  });

  describe('disabled persistence', () => {
    it('should not save to localStorage when disabled', async () => {
      const store = createMockStore();

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: false,
          store
        })
      );

      // Update selection
      act(() => {
        store.getState().setSelection(new Set<RowKey>(['1', '2']));
      });

      await waitFor(() => {
        expect(localStorage.getItem(storageKey)).toBeNull();
      });
    });

    it('should not load from localStorage when disabled', async () => {
      localStorage.setItem(storageKey, JSON.stringify(['1', '2']));

      const store = createMockStore();
      const setSelectionSpy = vi.spyOn(store.getState(), 'setSelection');

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: false,
          store
        })
      );

      // Wait a bit to ensure no load happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // setSelection should not be called for restoration
      expect(setSelectionSpy).not.toHaveBeenCalled();
    });
  });

  describe('clearSelection', () => {
    it('should clear selection from localStorage', () => {
      localStorage.setItem(storageKey, JSON.stringify(['1', '2']));

      const store = createMockStore();
      const { result } = renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const store = createMockStore();
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      // Update selection (should not crash)
      act(() => {
        store.getState().setSelection(new Set<RowKey>(['1']));
      });

      // Should log warning but not crash
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleWarnSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage', async () => {
      localStorage.setItem(storageKey, 'invalid json');

      const store = createMockStore();
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: true,
          store
        })
      );

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });
  });
});
