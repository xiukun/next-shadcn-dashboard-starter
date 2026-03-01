import type { StateCreator } from 'zustand';
import type { DataGridStoreState } from '../types';

export interface PaginationSlice {
  // Actions
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  setPageCount: (pageCount: number) => void;
  setRowCount: (rowCount: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

export const createPaginationSlice: StateCreator<
  DataGridStoreState,
  [],
  [],
  PaginationSlice
> = (set, get) => ({
  setPageIndex: (pageIndex) =>
    set((state) => ({
      pagination: { ...state.pagination, pageIndex }
    })),

  setPageSize: (pageSize) =>
    set((state) => ({
      pagination: { ...state.pagination, pageSize, pageIndex: 0 } // 重置到第一页
    })),

  setPageCount: (pageCount) =>
    set((state) => ({
      pagination: { ...state.pagination, pageCount }
    })),

  setRowCount: (rowCount) =>
    set((state) => {
      const pageSize = state.pagination.pageSize;
      const pageCount = Math.ceil(rowCount / pageSize);
      return {
        pagination: {
          ...state.pagination,
          rowCount,
          pageCount
        }
      };
    }),

  nextPage: () =>
    set((state) => {
      const { pageIndex, pageCount } = state.pagination;
      if (pageCount !== undefined && pageIndex < pageCount - 1) {
        return {
          pagination: { ...state.pagination, pageIndex: pageIndex + 1 }
        };
      }
      return state;
    }),

  previousPage: () =>
    set((state) => {
      const { pageIndex } = state.pagination;
      if (pageIndex > 0) {
        return {
          pagination: { ...state.pagination, pageIndex: pageIndex - 1 }
        };
      }
      return state;
    }),

  firstPage: () =>
    set((state) => ({
      pagination: { ...state.pagination, pageIndex: 0 }
    })),

  lastPage: () =>
    set((state) => {
      const { pageCount } = state.pagination;
      if (pageCount !== undefined && pageCount > 0) {
        return {
          pagination: { ...state.pagination, pageIndex: pageCount - 1 }
        };
      }
      return state;
    })
});
