import type { StateCreator } from 'zustand';
import type { RowKey } from '@maita-table/core';
import type { DataGridStoreState } from '../types';

export interface DataSlice<Row = any> {
  // Actions
  setRows: (rows: Row[]) => void;
  setTotalCount: (count: number) => void;
  updateRow: (rowKey: RowKey, row: Row) => void;
  updateRows: (updates: Array<{ rowKey: RowKey; row: Row }>) => void;
}

export const createDataSlice: StateCreator<
  DataGridStoreState,
  [],
  [],
  DataSlice
> = (set) => ({
  setRows: (rows) =>
    set((state) => ({
      data: { ...state.data, rows }
    })),

  setTotalCount: (count) =>
    set((state) => ({
      data: { ...state.data, totalCount: count }
    })),

  updateRow: (rowKey, row) =>
    set((state) => {
      const rowIndex = state.data.rows.findIndex(
        (r, i) => String(i) === String(rowKey) || (r as any).id === rowKey
      );
      if (rowIndex === -1) return state;

      const nextRows = [...state.data.rows];
      nextRows[rowIndex] = row;

      return {
        data: { ...state.data, rows: nextRows }
      };
    }),

  updateRows: (updates) =>
    set((state) => {
      const nextRows = [...state.data.rows];
      updates.forEach(({ rowKey, row }) => {
        const rowIndex = nextRows.findIndex(
          (r, i) => String(i) === String(rowKey) || (r as any).id === rowKey
        );
        if (rowIndex >= 0) {
          nextRows[rowIndex] = row;
        }
      });

      return {
        data: { ...state.data, rows: nextRows }
      };
    })
});
