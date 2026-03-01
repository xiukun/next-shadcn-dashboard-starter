import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSelectionPersistence } from '../../src/hooks/useSelectionPersistence';
import type { ReactDataGridStore } from '../../src/store';
import type { DataGridControllerState, RowKey } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

function createMockStore(
  initialSelection: RowKey[] = []
): ReactDataGridStore<Row> {
  const state: DataGridControllerState<Row> = {
    view: {
      columns: [],
      sort: [],
      filters: [],
      globalSearch: undefined,
      groupBy: [],
      paginationMode: 'page',
      pageIndex: 0,
      pageSize: 20,
      density: 'comfortable'
    },
    runtime: {
      loading: false,
      selection: new Set(initialSelection),
      expandedRowKeys: new Set(),
      editingDraftValues: {},
      validationErrors: {},
      scrollTop: 0,
      scrollLeft: 0,
      pendingEdits: [],
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {}
    },
    data: {
      rows: [
        { id: 1, name: 'Row 1' },
        { id: 2, name: 'Row 2' },
        { id: 3, name: 'Row 3' }
      ],
      totalRowCount: 3
    }
  };

  const subscribers: Array<(state: DataGridControllerState<Row>) => void> = [];

  return {
    getState: vi.fn(() => state),
    setState: vi.fn((updater) => {
      const nextState =
        typeof updater === 'function' ? updater(state) : updater;
      Object.assign(state, nextState);
      // Notify subscribers
      subscribers.forEach((sub) => sub(state));
    }),
    dispatch: vi.fn(),
    subscribe: vi.fn((callback) => {
      subscribers.push(callback);
      return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      };
    })
  } as unknown as ReactDataGridStore<Row>;
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
      store.setState({
        ...store.getState(),
        runtime: {
          ...store.getState().runtime,
          selection: new Set<RowKey>(['1', '2'])
        }
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
      store.setState({
        ...store.getState(),
        runtime: {
          ...store.getState().runtime,
          selection: new Set<RowKey>()
        }
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
      store.setState({
        ...store.getState(),
        runtime: {
          ...store.getState().runtime,
          selection: new Set<RowKey>(['1', '2'])
        }
      });

      await waitFor(() => {
        expect(localStorage.getItem(storageKey)).toBeNull();
      });
    });

    it('should not load from localStorage when disabled', async () => {
      localStorage.setItem(storageKey, JSON.stringify(['1', '2']));

      const store = createMockStore();
      const setStateSpy = vi.spyOn(store, 'setState');

      renderHook(() =>
        useSelectionPersistence({
          gridId,
          enabled: false,
          store
        })
      );

      // Wait a bit to ensure no load happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // setState should not be called for restoration
      expect(setStateSpy).not.toHaveBeenCalled();
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
      store.setState({
        ...store.getState(),
        runtime: {
          ...store.getState().runtime,
          selection: new Set<RowKey>(['1'])
        }
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
