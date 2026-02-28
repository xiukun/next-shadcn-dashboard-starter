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
    }
  | {
      type: 'edit/queue';
      cell: DataGridControllerState<Row>['runtime']['editingCell'];
      value: unknown;
    }
  | {
      type: 'edit/queueRow';
      rowKey: string;
      editedRow: Partial<Row>;
    }
  | {
      type: 'edit/removeFromQueue';
      rowKey: string;
    }
  | {
      type: 'submission/start';
      rowKeys?: string[];
    }
  | {
      type: 'submission/success';
      rowKeys: string[];
    }
  | {
      type: 'submission/error';
      rowKeys: string[];
      errors: Array<{ rowKey: string; error: string }>;
    }
  | {
      type: 'submission/reset';
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
          const { [key]: _removed, ...restDrafts } =
            state.runtime.editingDraftValues;
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
          const { [key]: _removed, ...restDrafts } =
            state.runtime.editingDraftValues;
          return {
            ...state,
            runtime: {
              ...state.runtime,
              editingCell: undefined,
              editingDraftValues: restDrafts
            }
          };
        }
        case 'edit/queue': {
          const cell = event.cell;
          if (!cell) return state;

          // 限制队列大小（最大 1000 条）
          const MAX_QUEUE_SIZE = 1000;
          if (state.runtime.pendingEdits.length >= MAX_QUEUE_SIZE) {
            // 如果队列已满，移除最旧的编辑（FIFO）
            const newPendingEdits = state.runtime.pendingEdits.slice(1);
            // 继续处理新的编辑
            const cell = event.cell;
            if (!cell) return state;
            const rowIndex = state.data.rows.findIndex(
              (r, i) =>
                String(i) === String(cell.rowKey) ||
                (r as any).id === cell.rowKey
            );
            if (rowIndex === -1) return state;
            const row = state.data.rows[rowIndex] as Row;
            const editedRow: Partial<Row> = {
              [cell.columnId]: event.value
            };
            const pendingEdit = {
              rowKey: String(cell.rowKey),
              rowIndex,
              originalRow: row,
              editedRow,
              timestamp: Date.now()
            };
            return {
              ...state,
              runtime: {
                ...state.runtime,
                pendingEdits: [...newPendingEdits, pendingEdit]
              }
            };
          }

          // 查找对应的行
          const rowIndex = state.data.rows.findIndex(
            (r, i) =>
              String(i) === String(cell.rowKey) || (r as any).id === cell.rowKey
          );
          if (rowIndex === -1) return state;

          const row = state.data.rows[rowIndex] as Row;
          const existingIndex = state.runtime.pendingEdits.findIndex(
            (e) => e.rowKey === String(cell.rowKey)
          );

          const editedRow: Partial<Row> = {
            ...(existingIndex >= 0
              ? state.runtime.pendingEdits[existingIndex].editedRow
              : {}),
            [cell.columnId]: event.value
          };

          const pendingEdit = {
            rowKey: String(cell.rowKey),
            rowIndex,
            originalRow: row,
            editedRow,
            timestamp: Date.now()
          };

          const nextPendingEdits = [...state.runtime.pendingEdits];
          if (existingIndex >= 0) {
            nextPendingEdits[existingIndex] = pendingEdit;
          } else {
            // 限制队列大小
            const MAX_PENDING_EDITS = 1000;
            if (nextPendingEdits.length >= MAX_PENDING_EDITS) {
              nextPendingEdits.shift();
            }
            nextPendingEdits.push(pendingEdit);
          }

          return {
            ...state,
            runtime: {
              ...state.runtime,
              pendingEdits: nextPendingEdits
            }
          };
        }
        case 'edit/queueRow': {
          const rowIndex = state.data.rows.findIndex(
            (r, i) =>
              String(i) === event.rowKey || (r as any).id === event.rowKey
          );
          if (rowIndex === -1) return state;

          const row = state.data.rows[rowIndex] as Row;
          const existingIndex = state.runtime.pendingEdits.findIndex(
            (e) => e.rowKey === event.rowKey
          );

          const pendingEdit = {
            rowKey: event.rowKey,
            rowIndex,
            originalRow: row,
            editedRow: event.editedRow,
            timestamp: Date.now()
          };

          const nextPendingEdits = [...state.runtime.pendingEdits];
          if (existingIndex >= 0) {
            nextPendingEdits[existingIndex] = pendingEdit;
          } else {
            const MAX_PENDING_EDITS = 1000;
            if (nextPendingEdits.length >= MAX_PENDING_EDITS) {
              nextPendingEdits.shift();
            }
            nextPendingEdits.push(pendingEdit);
          }

          return {
            ...state,
            runtime: {
              ...state.runtime,
              pendingEdits: nextPendingEdits
            }
          };
        }
        case 'edit/removeFromQueue': {
          const nextPendingEdits = state.runtime.pendingEdits.filter(
            (e) => e.rowKey !== event.rowKey
          );
          return {
            ...state,
            runtime: {
              ...state.runtime,
              pendingEdits: nextPendingEdits
            }
          };
        }
        case 'submission/start': {
          return {
            ...state,
            runtime: {
              ...state.runtime,
              submission: {
                status: 'submitting',
                submittedRows: event.rowKeys || [],
                failedRows: []
              }
            }
          };
        }
        case 'submission/success': {
          return {
            ...state,
            runtime: {
              ...state.runtime,
              submission: {
                ...state.runtime.submission,
                status: 'success',
                submittedRows: event.rowKeys
              }
            }
          };
        }
        case 'submission/error': {
          return {
            ...state,
            runtime: {
              ...state.runtime,
              submission: {
                status: 'error',
                submittedRows: event.rowKeys,
                failedRows: event.errors
              }
            }
          };
        }
        case 'submission/reset': {
          return {
            ...state,
            runtime: {
              ...state.runtime,
              submission: {
                status: 'idle',
                submittedRows: [],
                failedRows: []
              }
            }
          };
        }
        default:
          return state;
      }
    }
  };
}
