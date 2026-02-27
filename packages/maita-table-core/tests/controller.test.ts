import { describe, expect, it } from 'vitest';
import { createDefaultController } from '../src/controller';
import type { DataGridControllerState } from '../src/state';

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
      pageSize: 20,
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

describe('createDefaultController', () => {
  it('builds query from view state', () => {
    const controller = createDefaultController<Row>();
    const state = createInitialState();
    const query = controller.buildQuery(state);
    expect(query.page).toEqual({ index: 0, size: 20 });
    expect(query.sort).toEqual([]);
    expect(query.filters).toEqual([]);
  });

  it('updates sort state via reduce', () => {
    const controller = createDefaultController<Row>();
    const state = createInitialState();
    const next = controller.reduce(state, {
      type: 'sort/change',
      sort: [{ id: 'name', desc: false }]
    });
    expect(next.view.sort).toEqual([{ id: 'name', desc: false }]);
  });

  it('respects pageIndex in query', () => {
    const controller = createDefaultController<Row>();
    const state = createInitialState();
    state.view.pageIndex = 3;
    const query = controller.buildQuery(state);
    expect(query.page).toEqual({ index: 3, size: 20 });
  });

  it('patches runtime state via reduce', () => {
    const controller = createDefaultController<Row>();
    const state = createInitialState();
    const next = controller.reduce(state, {
      type: 'runtime/patch',
      patch: { loading: true }
    });
    expect(next.runtime.loading).toBe(true);
  });
});
