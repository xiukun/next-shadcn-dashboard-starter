import { describe, expect, it } from 'vitest';
import { createDataGridStore, createInitialState } from '../src/store';
import type { ColumnConfig } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name }
];

describe('createDataGridStore', () => {
  it('updates state when calling actions', () => {
    const store = createDataGridStore(createInitialState(columns));

    // Test setSort action
    store.getState().setSort([{ id: 'name', desc: false }]);

    const state = store.getState();
    expect(state.view.sort).toEqual([{ id: 'name', desc: false }]);
  });

  it('updates pagination state', () => {
    const store = createDataGridStore(createInitialState(columns));

    // Test pagination actions
    // Note: setPageSize resets pageIndex to 0, so set pageSize first
    store.getState().setPageSize(20);
    store.getState().setPageIndex(2);

    const state = store.getState();
    expect(state.pagination.pageIndex).toBe(2);
    expect(state.pagination.pageSize).toBe(20);
  });

  it('updates selection state', () => {
    const store = createDataGridStore(createInitialState(columns));

    // Test selection actions
    store.getState().setSelection(new Set(['1', '2']));

    const state = store.getState();
    expect(state.runtime.selection.has('1')).toBe(true);
    expect(state.runtime.selection.has('2')).toBe(true);
    expect(state.runtime.selection.size).toBe(2);
  });
});
