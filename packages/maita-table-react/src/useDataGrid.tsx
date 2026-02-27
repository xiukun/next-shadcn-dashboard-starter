import * as React from 'react';
import type {
  ColumnConfig,
  DataGridControllerState,
  DataGridResult,
  DataSource
} from '@maita-table/core';
import { createDefaultController } from '@maita-table/core';
import { createDataGridStore, type ReactDataGridStore } from './store';

export interface UseDataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
}

export interface UseDataGridResult<Row> {
  state: DataGridControllerState<Row>;
  store: ReactDataGridStore<Row>;
}

export function useDataGrid<Row>(
  props: UseDataGridProps<Row>
): UseDataGridResult<Row> {
  const { columns, dataSource } = props;

  const storeRef = React.useRef<ReactDataGridStore<Row> | undefined>(undefined);

  if (!storeRef.current) {
    const controller = createDefaultController<Row>();
    const initialState: DataGridControllerState<Row> = {
      view: {
        columns,
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

    storeRef.current = createDataGridStore<Row>({
      initialState,
      controller
    });
  }

  const store = storeRef.current!;
  const [state, setState] = React.useState<DataGridControllerState<Row>>(
    store.getState()
  );

  React.useEffect(() => {
    const unsubscribe = store.subscribe((next) => {
      setState(next);
    });
    return unsubscribe;
  }, [store]);

  React.useEffect(() => {
    let aborted = false;
    const controller = store.controller;
    const current = store.getState();
    const query = controller.buildQuery(current);

    store.dispatch({
      type: 'runtime/patch',
      patch: { loading: true }
    });

    const abortController = new AbortController();

    dataSource
      .fetch(query, abortController.signal)
      .then((result: DataGridResult<Row>) => {
        if (aborted) return;
        const next: DataGridControllerState<Row> = {
          ...store.getState(),
          runtime: {
            ...store.getState().runtime,
            loading: false
          },
          data: result
        };
        store.setState(next);
      })
      .catch(() => {
        if (aborted) return;
        const currentState = store.getState();
        store.setState({
          ...currentState,
          runtime: {
            ...currentState.runtime,
            loading: false
          }
        });
      });

    return () => {
      aborted = true;
      abortController.abort();
    };
  }, [dataSource, store]);

  return { state, store };
}
