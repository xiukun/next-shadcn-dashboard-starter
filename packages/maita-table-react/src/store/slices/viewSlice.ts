import type { StateCreator } from 'zustand';
import type { ColumnConfig, GroupState, SortState } from '@maita-table/core';
import type { DataGridQuery } from '@maita-table/core';
import type { DataGridStoreState } from '../types';

export interface ViewSlice<Row = any> {
  // Actions
  setSort: (sort: SortState) => void;
  setFilters: (filters: DataGridQuery['filters']) => void;
  setGlobalSearch: (value: string) => void;
  setGroupBy: (groupBy: GroupState) => void;
  setColumnsOrder: (order: string[]) => void;
  setColumnWidth: (columnId: string, width: number) => void;
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  setColumnPinned: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
}

export const createViewSlice: StateCreator<
  DataGridStoreState,
  [],
  [],
  ViewSlice
> = (set) => ({
  setSort: (sort) =>
    set((state) => ({
      view: { ...state.view, sort }
    })),

  setFilters: (filters) =>
    set((state) => ({
      view: { ...state.view, filters: filters ?? [] }
    })),

  setGlobalSearch: (value) =>
    set((state) => ({
      view: { ...state.view, globalSearch: value }
    })),

  setGroupBy: (groupBy) =>
    set((state) => ({
      view: { ...state.view, groupBy: groupBy ?? [] }
    })),

  setColumnsOrder: (order) =>
    set((state) => ({
      view: { ...state.view, columnsOrder: order }
    })),

  setColumnWidth: (columnId, width) =>
    set((state) => ({
      view: {
        ...state.view,
        columnsWidth: {
          ...state.view.columnsWidth,
          [columnId]: width
        }
      }
    })),

  setColumnVisibility: (columnId, visible) =>
    set((state) => ({
      view: {
        ...state.view,
        columnsVisibility: {
          ...state.view.columnsVisibility,
          [columnId]: visible
        }
      }
    })),

  setColumnPinned: (columnId, pinned) =>
    set((state) => {
      const nextPinned = { ...state.view.columnsPinned };
      if (pinned) {
        nextPinned[columnId] = pinned;
      } else {
        delete nextPinned[columnId];
      }
      return {
        view: {
          ...state.view,
          columnsPinned: nextPinned
        }
      };
    }),

  setDensity: (density) =>
    set((state) => ({
      view: { ...state.view, density }
    }))
});
