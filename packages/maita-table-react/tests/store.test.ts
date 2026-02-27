import { describe, expect, it } from 'vitest';
import { createDefaultController } from '@maita-table/core/src/controller';
import type { DataGridControllerState } from '@maita-table/core/src/state';
import { createDataGridStore } from '../src/store';

interface Row {
  id: number;
  name: string;
}

function createInitialState(): DataGridControllerState<Row> {
  return {
    view: {
      columns: [],
      sort: [],
      filters: [],
      globalSearch: undefined,
      groupBy: [],
      paginationMode: 'page',
      pageIndex: 0,
      pageSize: 10,
      density: 'comfortable'
    },
    runtime: {
      loading: false,
      selection: new Set(),
      expandedRowKeys: new Set(),
      validationErrors: {},
      scrollTop: 0,
      scrollLeft: 0
    },
    data: {
      rows: [],
      totalRowCount: 0
    }
  };
}

describe('createDataGridStore', () => {
  it('updates state when dispatching events', () => {
    const controller = createDefaultController<Row>();
    const store = createDataGridStore<Row>({
      initialState: createInitialState(),
      controller
    });

    store.dispatch({
      type: 'sort/change',
      sort: [{ id: 'name', desc: false }]
    });

    const state = store.getState();
    expect(state.view.sort).toEqual([{ id: 'name', desc: false }]);
  });
});
