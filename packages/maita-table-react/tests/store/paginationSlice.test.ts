import { describe, it, expect, beforeEach } from 'vitest';
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

describe('PaginationSlice', () => {
  let store: ReturnType<typeof createDataGridStore<Row>>;

  beforeEach(() => {
    store = createDataGridStore(createInitialState(columns));
  });

  describe('setPageIndex', () => {
    it('should update pageIndex', () => {
      store.getState().setPageIndex(2);
      expect(store.getState().pagination.pageIndex).toBe(2);
    });

    it('should allow setting pageIndex to 0', () => {
      store.getState().setPageIndex(5);
      store.getState().setPageIndex(0);
      expect(store.getState().pagination.pageIndex).toBe(0);
    });
  });

  describe('setPageSize', () => {
    it('should update pageSize and reset pageIndex to 0', () => {
      store.getState().setPageIndex(3);
      store.getState().setPageSize(20);
      expect(store.getState().pagination.pageSize).toBe(20);
      expect(store.getState().pagination.pageIndex).toBe(0);
    });

    it('should update pageSize', () => {
      store.getState().setPageSize(50);
      expect(store.getState().pagination.pageSize).toBe(50);
    });
  });

  describe('setPageCount', () => {
    it('should update pageCount', () => {
      store.getState().setPageCount(10);
      expect(store.getState().pagination.pageCount).toBe(10);
    });
  });

  describe('setRowCount', () => {
    it('should update rowCount and calculate pageCount', () => {
      store.getState().setPageSize(10);
      store.getState().setRowCount(25);
      expect(store.getState().pagination.rowCount).toBe(25);
      expect(store.getState().pagination.pageCount).toBe(3); // Math.ceil(25/10) = 3
    });

    it('should handle exact division', () => {
      store.getState().setPageSize(10);
      store.getState().setRowCount(30);
      expect(store.getState().pagination.pageCount).toBe(3); // Math.ceil(30/10) = 3
    });

    it('should handle zero rowCount', () => {
      store.getState().setRowCount(0);
      expect(store.getState().pagination.rowCount).toBe(0);
      expect(store.getState().pagination.pageCount).toBe(0);
    });
  });

  describe('nextPage', () => {
    it('should increment pageIndex when not on last page', () => {
      store.getState().setPageCount(5);
      store.getState().setPageIndex(2);
      store.getState().nextPage();
      expect(store.getState().pagination.pageIndex).toBe(3);
    });

    it('should not increment when on last page', () => {
      store.getState().setPageCount(5);
      store.getState().setPageIndex(4);
      store.getState().nextPage();
      expect(store.getState().pagination.pageIndex).toBe(4);
    });

    it('should not increment when pageCount is undefined', () => {
      store.getState().setPageIndex(2);
      store.getState().nextPage();
      expect(store.getState().pagination.pageIndex).toBe(2);
    });
  });

  describe('previousPage', () => {
    it('should decrement pageIndex when not on first page', () => {
      store.getState().setPageIndex(3);
      store.getState().previousPage();
      expect(store.getState().pagination.pageIndex).toBe(2);
    });

    it('should not decrement when on first page', () => {
      store.getState().setPageIndex(0);
      store.getState().previousPage();
      expect(store.getState().pagination.pageIndex).toBe(0);
    });
  });

  describe('firstPage', () => {
    it('should set pageIndex to 0', () => {
      store.getState().setPageIndex(5);
      store.getState().firstPage();
      expect(store.getState().pagination.pageIndex).toBe(0);
    });
  });

  describe('lastPage', () => {
    it('should set pageIndex to last page when pageCount is defined', () => {
      store.getState().setPageCount(5);
      store.getState().lastPage();
      expect(store.getState().pagination.pageIndex).toBe(4); // pageCount - 1
    });

    it('should not change pageIndex when pageCount is undefined', () => {
      store.getState().setPageIndex(2);
      store.getState().lastPage();
      expect(store.getState().pagination.pageIndex).toBe(2);
    });

    it('should not change pageIndex when pageCount is 0', () => {
      store.getState().setPageCount(0);
      store.getState().setPageIndex(2);
      store.getState().lastPage();
      expect(store.getState().pagination.pageIndex).toBe(2);
    });
  });
});
