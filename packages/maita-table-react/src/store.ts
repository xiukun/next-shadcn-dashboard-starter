import type {
  DataGridController,
  DataGridControllerState
} from '@maita-table/core';
import { createStore } from 'zustand/vanilla';

export interface ReactDataGridStore<Row = any> {
  getState: () => DataGridControllerState<Row>;
  setState: (
    next:
      | DataGridControllerState<Row>
      | ((prev: DataGridControllerState<Row>) => DataGridControllerState<Row>)
  ) => void;
  subscribe: (
    listener: (state: DataGridControllerState<Row>) => void
  ) => () => void;
  controller: DataGridController<Row>;
  dispatch: (event: Parameters<DataGridController<Row>['reduce']>[1]) => void;
}

export interface CreateDataGridStoreOptions<Row = any> {
  initialState: DataGridControllerState<Row>;
  controller: DataGridController<Row>;
}

export function createDataGridStore<Row = any>(
  options: CreateDataGridStoreOptions<Row>
): ReactDataGridStore<Row> {
  const { initialState, controller } = options;

  const internal = createStore<DataGridControllerState<Row>>(
    () => initialState
  );

  return {
    getState: internal.getState,
    setState: internal.setState,
    subscribe: internal.subscribe,
    controller,
    dispatch(event) {
      const prev = internal.getState();
      const next = controller.reduce(prev, event as any);
      internal.setState(next);
    }
  };
}
