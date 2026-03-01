import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRowSelection } from '../../src/hooks/useRowSelection';
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

function createMockStore() {
  return createDataGridStore(
    createInitialState(columns, {
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

describe('useRowSelection', () => {
  let store: ReturnType<typeof createMockStore>;
  let onSelectionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = createMockStore();
    onSelectionChange = vi.fn();
  });

  describe('multiple selection mode', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      expect(result.current.getSelectedCount()).toBe(0);
      expect(result.current.isSelected('1')).toBe(false);
    });

    it('should toggle row selection', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.toggleRow('1');
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.getSelectedCount()).toBe(1);
      });
      expect(onSelectionChange).toHaveBeenCalledWith(['1']);

      act(() => {
        result.current.toggleRow('1');
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(false);
        expect(result.current.getSelectedCount()).toBe(0);
      });
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should select multiple rows', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectRow('1');
      });
      rerender();

      act(() => {
        result.current.selectRow('2');
      });
      rerender();

      act(() => {
        result.current.selectRow('3');
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(true);
        expect(result.current.isSelected('3')).toBe(true);
        expect(result.current.getSelectedCount()).toBe(3);
      });
    });

    it('should select all rows', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      const allRowKeys: RowKey[] = ['1', '2', '3'];

      act(() => {
        result.current.selectAll(allRowKeys);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.getSelectedCount()).toBe(3);
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(true);
        expect(result.current.isSelected('3')).toBe(true);
      });
    });

    it('should deselect all rows', () => {
      const { result } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectRow('1');
        result.current.selectRow('2');
        result.current.deselectAll();
      });

      expect(result.current.getSelectedCount()).toBe(0);
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should select range of rows', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      const allRowKeys: RowKey[] = ['1', '2', '3'];

      act(() => {
        result.current.selectRange('1', '3', allRowKeys);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(true);
        expect(result.current.isSelected('3')).toBe(true);
        expect(result.current.getSelectedCount()).toBe(3);
      });
    });

    it('should get selected count for specific keys', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectRow('1');
      });
      rerender();

      act(() => {
        result.current.selectRow('2');
      });
      rerender();

      await waitFor(() => {
        expect(result.current.getSelectedCountForKeys(['1', '2'])).toBe(2);
        expect(result.current.getSelectedCountForKeys(['1', '3'])).toBe(1);
        expect(result.current.getSelectedCountForKeys(['3'])).toBe(0);
      });
    });

    it('should select keys in batch', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectKeys(['1', '2', '3']);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.getSelectedCount()).toBe(3);
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(true);
        expect(result.current.isSelected('3')).toBe(true);
      });
    });

    it('should deselect keys in batch', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'multiple',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectKeys(['1', '2', '3']);
      });
      rerender();

      act(() => {
        result.current.deselectKeys(['1', '2']);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.getSelectedCount()).toBe(1);
        expect(result.current.isSelected('1')).toBe(false);
        expect(result.current.isSelected('2')).toBe(false);
        expect(result.current.isSelected('3')).toBe(true);
      });
    });
  });

  describe('single selection mode', () => {
    it('should only allow one row selected at a time', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'single',
          onSelectionChange
        })
      );

      act(() => {
        result.current.selectRow('1');
      });
      rerender();

      act(() => {
        result.current.selectRow('2');
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(false);
        expect(result.current.isSelected('2')).toBe(true);
        expect(result.current.getSelectedCount()).toBe(1);
      });
    });

    it('should select only first row in range selection', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'single',
          onSelectionChange
        })
      );

      const allRowKeys: RowKey[] = ['1', '2', '3'];

      act(() => {
        result.current.selectRange('1', '3', allRowKeys);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(false);
        expect(result.current.isSelected('3')).toBe(false);
        expect(result.current.getSelectedCount()).toBe(1);
      });
    });

    it('should select only first row in selectAll', async () => {
      const { result, rerender } = renderHook(() =>
        useRowSelection({
          store,
          selectionMode: 'single',
          onSelectionChange
        })
      );

      const allRowKeys: RowKey[] = ['1', '2', '3'];

      act(() => {
        result.current.selectAll(allRowKeys);
      });
      rerender();

      await waitFor(() => {
        expect(result.current.isSelected('1')).toBe(true);
        expect(result.current.isSelected('2')).toBe(false);
        expect(result.current.isSelected('3')).toBe(false);
        expect(result.current.getSelectedCount()).toBe(1);
      });
    });
  });

  describe('controlled mode', () => {
    it('should use controlled selectedRowKeys', () => {
      const { result, rerender } = renderHook(
        (props) => useRowSelection(props),
        {
          initialProps: {
            store,
            selectionMode: 'multiple',
            selectedRowKeys: ['1', '2'],
            onSelectionChange
          }
        }
      );

      expect(result.current.getSelectedCount()).toBe(2);
      expect(result.current.isSelected('1')).toBe(true);
      expect(result.current.isSelected('2')).toBe(true);

      rerender({
        store,
        selectionMode: 'multiple',
        selectedRowKeys: ['3'],
        onSelectionChange
      });

      expect(result.current.getSelectedCount()).toBe(1);
      expect(result.current.isSelected('1')).toBe(false);
      expect(result.current.isSelected('3')).toBe(true);
    });
  });
});
