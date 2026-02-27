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
    }
  | {
      type: 'edit/start';
      cell: DataGridControllerState<Row>['runtime']['editingCell'];
      initialValue: unknown;
    }
  | {
      type: 'edit/change';
      cell: DataGridControllerState<Row>['runtime']['editingCell'];
      value: unknown;
    }
  | {
      type: 'edit/cancel';
      cell: DataGridControllerState<Row>['runtime']['editingCell'];
    }
  | {
      type: 'edit/commit';
      cell: DataGridControllerState<Row>['runtime']['editingCell'];
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
        case 'edit/start': {
          const cell = event.cell;
          if (!cell) return state;
          const key = `${cell.rowKey}:${cell.columnId}`;
          return {
            ...state,
            runtime: {
              ...state.runtime,
              editingCell: cell,
              editingDraftValues: {
                ...state.runtime.editingDraftValues,
                [key]: event.initialValue
              }
            }
          };
        }
        case 'edit/change': {
          const cell = event.cell;
          if (!cell) return state;
          const key = `${cell.rowKey}:${cell.columnId}`;
          return {
            ...state,
            runtime: {
              ...state.runtime,
              editingDraftValues: {
                ...state.runtime.editingDraftValues,
                [key]: event.value
              }
            }
          };
        }
        case 'edit/cancel': {
          const cell = event.cell;
          if (!cell) return state;
          const key = `${cell.rowKey}:${cell.columnId}`;
          const { [key]: _removed, ...restDrafts } = state.runtime.editingDraftValues;
          return {
            ...state,
            runtime: {
              ...state.runtime,
              editingCell:
                state.runtime.editingCell &&
                state.runtime.editingCell.rowKey === cell.rowKey &&
                state.runtime.editingCell.columnId === cell.columnId
                  ? undefined
                  : state.runtime.editingCell,
              editingDraftValues: restDrafts
            }
          };
        }
        case 'edit/commit': {
          const cell = event.cell;
          if (!cell) return state;
          const key = `${cell.rowKey}:${cell.columnId}`;
          const { [key]: _removed, ...restDrafts } = state.runtime.editingDraftValues;
          return {
            ...state,
            runtime: {
              ...state.runtime,
              editingCell: undefined,
              editingDraftValues: restDrafts
            }
          };
        }
        default:
          return state;
      }
    }
  };
}
