import type { DataGridControllerState } from './state';
import type { DataGridQuery } from './query';

export type DataGridInternalEvent<Row = any> =
  | { type: 'sort/change'; sort: DataGridQuery['sort'] }
  | { type: 'filters/change'; filters: DataGridQuery['filters'] }
  | { type: 'globalSearch/change'; value: string }
  | { type: 'groupBy/change'; groupBy: DataGridQuery['groupBy'] }
  | { type: 'pageSize/change'; pageSize: number }
  | {
      type: 'runtime/patch';
      patch: Partial<DataGridControllerState<Row>['runtime']>;
    };

export interface DataGridController<Row = any> {
  buildQuery(state: DataGridControllerState<Row>): DataGridQuery;
  reduce(
    state: DataGridControllerState<Row>,
    event: DataGridInternalEvent<Row>
  ): DataGridControllerState<Row>;
}

export function createDefaultController<Row = any>(): DataGridController<Row> {
  return {
    buildQuery(state): DataGridQuery {
      const { view } = state;
      return {
        sort: view.sort,
        filters: view.filters,
        globalSearch: view.globalSearch,
        groupBy: view.groupBy,
        page:
          view.paginationMode === 'page'
            ? { index: view.pageIndex, size: view.pageSize }
            : undefined
      };
    },
    reduce(state, event) {
      switch (event.type) {
        case 'sort/change':
          return {
            ...state,
            view: {
              ...state.view,
              sort: event.sort ?? []
            }
          };
        case 'filters/change':
          return {
            ...state,
            view: {
              ...state.view,
              filters: event.filters ?? []
            }
          };
        case 'globalSearch/change':
          return {
            ...state,
            view: {
              ...state.view,
              globalSearch: event.value
            }
          };
        case 'groupBy/change':
          return {
            ...state,
            view: {
              ...state.view,
              groupBy: event.groupBy ?? []
            }
          };
        case 'pageSize/change':
          return {
            ...state,
            view: {
              ...state.view,
              pageSize: event.pageSize
            }
          };
        case 'runtime/patch':
          return {
            ...state,
            runtime: {
              ...state.runtime,
              ...event.patch
            }
          };
        default:
          return state;
      }
    }
  };
}
