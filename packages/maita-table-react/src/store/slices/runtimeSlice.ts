import type { StateCreator } from 'zustand';
import type {
  EditCell,
  PendingEdit,
  RowKey,
  SubmissionState
} from '@maita-table/core';
import type { DataGridStoreState } from '../types';

export interface RuntimeSlice<Row = any> {
  // Selection Actions
  setSelection: (selection: Set<RowKey>) => void;
  toggleRowSelection: (rowKey: RowKey) => void;
  selectRange: (start: RowKey, end: RowKey, allKeys: RowKey[]) => void;
  selectKeys: (keys: RowKey[]) => void;
  deselectKeys: (keys: RowKey[]) => void;
  clearSelection: () => void;

  // Editing Actions
  startEditing: (cell: EditCell, initialValue: unknown) => void;
  updateDraft: (cell: EditCell, value: unknown) => void;
  cancelEditing: (cell: EditCell) => void;
  commitEditing: (cell: EditCell) => void;

  // Validation Actions
  setValidationError: (key: string, error: string | null) => void;
  clearValidationErrors: () => void;
  setRowValidationErrors: (rowKey: string, errors: string[] | null) => void;

  // Submission Actions
  startSubmission: (rowKeys?: string[]) => void;
  completeSubmission: (rowKeys: string[]) => void;
  failSubmission: (
    rowKeys: string[],
    errors: Array<{ rowKey: string; error: string }>
  ) => void;
  resetSubmission: () => void;

  // Queue Actions
  queueEdit: (cell: EditCell, value: unknown) => void;
  queueRowEdit: (rowKey: string, editedRow: Partial<Row>) => void;
  removeFromQueue: (rowKey: string) => void;

  // Other Runtime Actions
  setLoading: (loading: boolean) => void;
  setScrollPosition: (scrollTop: number, scrollLeft: number) => void;
  toggleExpandedRow: (rowKey: RowKey) => void;
}

export const createRuntimeSlice: StateCreator<
  DataGridStoreState,
  [],
  [],
  RuntimeSlice
> = (set, get) => ({
  setSelection: (selection) =>
    set((state) => {
      // 避免不必要的更新：在大数据量场景下，仅做一次线性遍历，不创建中间数组
      const currentSelection = state.runtime.selection;

      // 引用相同直接跳过
      if (currentSelection === selection) {
        return state;
      }

      if (currentSelection.size === selection.size) {
        // 使用 forEach 兼容较低 target 配置
        let isSame = true;
        currentSelection.forEach((key) => {
          if (isSame && !selection.has(key)) {
            isSame = false;
          }
        });
        if (isSame) {
          // 选择集内容相同，不更新状态
          return state;
        }
      }

      return {
        runtime: { ...state.runtime, selection }
      };
    }),

  toggleRowSelection: (rowKey) =>
    set((state) => {
      const newSelection = new Set(state.runtime.selection);
      if (newSelection.has(rowKey)) {
        newSelection.delete(rowKey);
      } else {
        newSelection.add(rowKey);
      }
      return {
        runtime: { ...state.runtime, selection: newSelection }
      };
    }),

  selectRange: (start, end, allKeys) =>
    set((state) => {
      const startIndex = allKeys.indexOf(start);
      const endIndex = allKeys.indexOf(end);
      if (startIndex === -1 || endIndex === -1) return state;

      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const newSelection = new Set(state.runtime.selection);

      for (let i = minIndex; i <= maxIndex; i++) {
        newSelection.add(allKeys[i]!);
      }

      return {
        runtime: { ...state.runtime, selection: newSelection }
      };
    }),

  selectKeys: (keys) =>
    set((state) => {
      const newSelection = new Set(state.runtime.selection);
      keys.forEach((key) => newSelection.add(key));
      return {
        runtime: { ...state.runtime, selection: newSelection }
      };
    }),

  deselectKeys: (keys) =>
    set((state) => {
      const newSelection = new Set(state.runtime.selection);
      keys.forEach((key) => newSelection.delete(key));
      return {
        runtime: { ...state.runtime, selection: newSelection }
      };
    }),

  clearSelection: () =>
    set((state) => ({
      runtime: { ...state.runtime, selection: new Set() }
    })),

  startEditing: (cell, initialValue) =>
    set((state) => {
      const key = `${cell.rowKey}:${cell.columnId}`;
      return {
        runtime: {
          ...state.runtime,
          editingCell: cell,
          editingDraftValues: {
            ...state.runtime.editingDraftValues,
            [key]: initialValue
          }
        }
      };
    }),

  updateDraft: (cell, value) =>
    set((state) => {
      const key = `${cell.rowKey}:${cell.columnId}`;
      return {
        runtime: {
          ...state.runtime,
          editingDraftValues: {
            ...state.runtime.editingDraftValues,
            [key]: value
          }
        }
      };
    }),

  cancelEditing: (cell) =>
    set((state) => {
      const key = `${cell.rowKey}:${cell.columnId}`;
      const { [key]: _removed, ...restDrafts } =
        state.runtime.editingDraftValues;
      return {
        runtime: {
          ...state.runtime,
          editingCell:
            state.runtime.editingCell &&
            state.runtime.editingCell.rowKey === cell.rowKey &&
            state.runtime.editingCell.columnId === cell.columnId
              ? undefined
              : state.runtime.editingCell,
          editingDraftValues: restDrafts
        }
      };
    }),

  commitEditing: (cell) =>
    set((state) => {
      const key = `${cell.rowKey}:${cell.columnId}`;
      const { [key]: _removed, ...restDrafts } =
        state.runtime.editingDraftValues;
      return {
        runtime: {
          ...state.runtime,
          editingCell: undefined,
          editingDraftValues: restDrafts
        }
      };
    }),

  setValidationError: (key, error) =>
    set((state) => {
      const nextErrors = { ...state.runtime.validationErrors };
      if (error) {
        nextErrors[key] = error;
      } else {
        delete nextErrors[key];
      }
      return {
        runtime: { ...state.runtime, validationErrors: nextErrors }
      };
    }),

  clearValidationErrors: () =>
    set((state) => ({
      runtime: { ...state.runtime, validationErrors: {} }
    })),

  setRowValidationErrors: (rowKey, errors) =>
    set((state) => {
      const nextRowErrors = { ...state.runtime.rowValidationErrors };
      if (errors) {
        nextRowErrors[rowKey] = errors;
      } else {
        delete nextRowErrors[rowKey];
      }
      return {
        runtime: { ...state.runtime, rowValidationErrors: nextRowErrors }
      };
    }),

  startSubmission: (rowKeys) =>
    set((state) => ({
      runtime: {
        ...state.runtime,
        submission: {
          status: 'submitting',
          submittedRows: rowKeys || [],
          failedRows: []
        }
      }
    })),

  completeSubmission: (rowKeys) =>
    set((state) => ({
      runtime: {
        ...state.runtime,
        submission: {
          ...state.runtime.submission,
          status: 'success',
          submittedRows: rowKeys
        }
      }
    })),

  failSubmission: (rowKeys, errors) =>
    set((state) => ({
      runtime: {
        ...state.runtime,
        submission: {
          status: 'error',
          submittedRows: rowKeys,
          failedRows: errors
        }
      }
    })),

  resetSubmission: () =>
    set((state) => ({
      runtime: {
        ...state.runtime,
        submission: {
          status: 'idle',
          submittedRows: [],
          failedRows: []
        }
      }
    })),

  queueEdit: (cell, value) =>
    set((state) => {
      const rowIndex = state.data.rows.findIndex(
        (r, i) =>
          String(i) === String(cell.rowKey) || (r as any).id === cell.rowKey
      );
      if (rowIndex === -1) return state;

      const row = state.data.rows[rowIndex] as any;
      const existingIndex = state.runtime.pendingEdits.findIndex(
        (e) => e.rowKey === String(cell.rowKey)
      );

      const editedRow: Partial<any> = {
        ...(existingIndex >= 0
          ? state.runtime.pendingEdits[existingIndex]!.editedRow
          : {}),
        [cell.columnId]: value
      };

      const pendingEdit: PendingEdit<any> = {
        rowKey: String(cell.rowKey),
        rowIndex,
        originalRow: row,
        editedRow,
        timestamp: Date.now()
      };

      const nextPendingEdits = [...state.runtime.pendingEdits];
      if (existingIndex >= 0) {
        nextPendingEdits[existingIndex] = pendingEdit;
      } else {
        const MAX_PENDING_EDITS = 1000;
        if (nextPendingEdits.length >= MAX_PENDING_EDITS) {
          nextPendingEdits.shift();
        }
        nextPendingEdits.push(pendingEdit);
      }

      return {
        runtime: {
          ...state.runtime,
          pendingEdits: nextPendingEdits
        }
      };
    }),

  queueRowEdit: (rowKey, editedRow) =>
    set((state) => {
      const rowIndex = state.data.rows.findIndex(
        (r, i) => String(i) === rowKey || (r as any).id === rowKey
      );
      if (rowIndex === -1) return state;

      const row = state.data.rows[rowIndex] as any;
      const existingIndex = state.runtime.pendingEdits.findIndex(
        (e) => e.rowKey === rowKey
      );

      const pendingEdit: PendingEdit<any> = {
        rowKey,
        rowIndex,
        originalRow: row,
        editedRow,
        timestamp: Date.now()
      };

      const nextPendingEdits = [...state.runtime.pendingEdits];
      if (existingIndex >= 0) {
        nextPendingEdits[existingIndex] = pendingEdit;
      } else {
        const MAX_PENDING_EDITS = 1000;
        if (nextPendingEdits.length >= MAX_PENDING_EDITS) {
          nextPendingEdits.shift();
        }
        nextPendingEdits.push(pendingEdit);
      }

      return {
        runtime: {
          ...state.runtime,
          pendingEdits: nextPendingEdits
        }
      };
    }),

  removeFromQueue: (rowKey) =>
    set((state) => ({
      runtime: {
        ...state.runtime,
        pendingEdits: state.runtime.pendingEdits.filter(
          (e) => e.rowKey !== rowKey
        )
      }
    })),

  setLoading: (loading) =>
    set((state) => ({
      runtime: { ...state.runtime, loading }
    })),

  setScrollPosition: (scrollTop, scrollLeft) =>
    set((state) => ({
      runtime: { ...state.runtime, scrollTop, scrollLeft }
    })),

  toggleExpandedRow: (rowKey) =>
    set((state) => {
      const newExpanded = new Set(state.runtime.expandedRowKeys);
      if (newExpanded.has(rowKey)) {
        newExpanded.delete(rowKey);
      } else {
        newExpanded.add(rowKey);
      }
      return {
        runtime: { ...state.runtime, expandedRowKeys: newExpanded }
      };
    })
});
