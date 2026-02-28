'use client';

import * as React from 'react';
import type {
  ColumnConfig,
  DataGridControllerState,
  DataGridResult,
  DataGridViewState,
  DataSource
} from '@maita-table/core';
import { createDefaultController } from '@maita-table/core';
import { createDataGridStore, type ReactDataGridStore } from './store';
import { useColumnPersistence } from './hooks/useColumnPersistence';

export interface UseDataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  initialViewState?: Partial<DataGridViewState<Row>>;
  enableColumnPersistence?: boolean;
}

export interface UseDataGridResult<Row> {
  state: DataGridControllerState<Row>;
  store: ReactDataGridStore<Row>;
}

export function useDataGrid<Row>(
  props: UseDataGridProps<Row>
): UseDataGridResult<Row> {
  const {
    columns,
    dataSource,
    initialViewState,
    id,
    enableColumnPersistence = true
  } = props;

  // 列状态持久化（仅在浏览器端、组件挂载后加载，避免 SSR 与水合不一致）
  const { loadColumnState } = useColumnPersistence({
    gridId: id,
    enabled: enableColumnPersistence
  });

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
        density: 'comfortable',
        // 注意：这里只使用来自 props 的 initialViewState，
        // 不在首屏渲染阶段读取 localStorage，
        // 以避免服务端与客户端初始 HTML 不一致导致的水合错误。
        ...(initialViewState ?? {})
      },
      runtime: {
        loading: false,
        selection: new Set(),
        expandedRowKeys: new Set(),
        editingDraftValues: {},
        validationErrors: {},
        scrollTop: 0,
        scrollLeft: 0,
        pendingEdits: [],
        submission: {
          status: 'idle',
          submittedRows: [],
          failedRows: []
        },
        rowValidationErrors: {}
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

  // 挂载后再加载并应用本地持久化的列视图状态（列顺序/宽度/可见性/固定等）
  // 这样可以保证：
  // - SSR 阶段不访问 window/localStorage
  // - 客户端首帧与服务端 HTML 一致，避免水合报错
  React.useEffect(() => {
    if (!enableColumnPersistence) return;

    const persisted = loadColumnState();
    if (!persisted) return;

    const current = store.getState();

    // 处理列顺序：基于持久化结果，但自动补全新增列、移除已不存在的列
    const allColumnIds = current.view.columns.map((c) => c.id);
    let nextOrder =
      persisted.columnsOrder && persisted.columnsOrder.length > 0
        ? [...persisted.columnsOrder]
        : current.view.columnsOrder && current.view.columnsOrder.length > 0
          ? [...(current.view.columnsOrder as string[])]
          : [...allColumnIds];

    // 过滤掉已经不存在的列
    nextOrder = nextOrder.filter((id) => allColumnIds.includes(id));
    // 把新增列 append 到末尾
    allColumnIds.forEach((id) => {
      if (!nextOrder.includes(id)) nextOrder.push(id);
    });

    // 只覆盖视图中和列相关的配置，保留其它状态；
    // 对于新增列，如果持久化里没有记录，则使用当前视图（通常来自 initialViewState）的默认值。
    const nextView: DataGridViewState<Row> = {
      ...current.view,
      columnsOrder: nextOrder,
      columnsWidth: persisted.columnsWidth ?? current.view.columnsWidth,
      columnsVisibility:
        persisted.columnsVisibility ?? current.view.columnsVisibility,
      columnsPinned: persisted.columnsPinned ?? current.view.columnsPinned
    };

    store.setState({
      ...current,
      view: nextView
    });
  }, [enableColumnPersistence, loadColumnState, store]);

  return { state, store };
}
