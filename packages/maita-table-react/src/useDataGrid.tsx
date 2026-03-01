'use client';

import * as React from 'react';
import type {
  ColumnConfig,
  DataGridResult,
  DataGridViewState,
  DataSource,
  DataGridQuery
} from '@maita-table/core';
import {
  createDataGridStore,
  createInitialState,
  type DataGridStore
} from './store/index';
import { useColumnPersistence } from './hooks/useColumnPersistence';
import type { DataGridStoreState } from './store/types';

export interface UseDataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  initialViewState?: Partial<DataGridViewState<Row>>;
  enableColumnPersistence?: boolean;
  /**
   * 初始分页状态
   */
  initialPagination?: {
    pageIndex?: number;
    pageSize?: number;
  };
}

export interface UseDataGridResult<Row> {
  state: DataGridStoreState<Row>;
  store: DataGridStore<Row>;
}

export function useDataGrid<Row>(
  props: UseDataGridProps<Row>
): UseDataGridResult<Row> {
  const {
    columns,
    dataSource,
    initialViewState,
    id,
    enableColumnPersistence = true,
    initialPagination
  } = props;

  // 列状态持久化（仅在浏览器端、组件挂载后加载，避免 SSR 与水合不一致）
  const { loadColumnState } = useColumnPersistence({
    gridId: id,
    enabled: enableColumnPersistence
  });

  const storeRef = React.useRef<DataGridStore<Row> | undefined>(undefined);

  if (!storeRef.current) {
    // 从 initialViewState 中排除 columns，因为 columns 已经作为单独参数传入
    const { columns: _, ...viewStateWithoutColumns } = initialViewState ?? {};

    type ViewStateWithoutColumns = Omit<
      DataGridStoreState<Row>['view'],
      'columns'
    >;

    const initialState = createInitialState<Row>(columns, {
      view: {
        sort: [],
        filters: [],
        globalSearch: undefined,
        groupBy: [],
        density: 'comfortable',
        // 注意：这里只使用来自 props 的 initialViewState（排除 columns），
        // 不在首屏渲染阶段读取 localStorage，
        // 以避免服务端与客户端初始 HTML 不一致导致的水合错误。
        ...(viewStateWithoutColumns as Partial<ViewStateWithoutColumns>)
      },
      pagination: {
        pageIndex:
          initialPagination?.pageIndex ?? initialViewState?.pageIndex ?? 0,
        pageSize:
          initialPagination?.pageSize ?? initialViewState?.pageSize ?? 20
      }
    });

    storeRef.current = createDataGridStore<Row>(initialState);
  }

  const store = storeRef.current!;

  // 订阅状态变化（使用 selector 来触发重新渲染）
  const state = React.useSyncExternalStore(
    store.subscribe,
    () => store.getState(),
    () => store.getState()
  );

  React.useEffect(() => {
    let aborted = false;
    const current = store.getState();

    // 构建查询（包含排序、过滤、分组和分页信息）
    const query: DataGridQuery = {
      sort: current.view.sort,
      filters: current.view.filters,
      globalSearch: current.view.globalSearch,
      groupBy: current.view.groupBy,
      page: {
        index: current.pagination.pageIndex,
        size: current.pagination.pageSize
      }
    };

    store.getState().setLoading(true);

    const abortController = new AbortController();

    dataSource
      .fetch(query, abortController.signal)
      .then((result: DataGridResult<Row>) => {
        if (aborted) return;

        // 更新数据行
        const apiRows = result.rows ?? [];
        store.getState().setRows(apiRows);

        // 兼容 totalRowCount / totalCount 两种命名
        const total =
          result.totalRowCount ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result as any)?.totalCount;

        if (typeof total === 'number') {
          // Data 部分总数（可用于展示）
          store.getState().setTotalCount(total);
          // 分页部分总数（用于计算 pageCount 和分页边界）
          store.getState().setRowCount(total);
        }

        store.getState().setLoading(false);
      })
      .catch(() => {
        if (aborted) return;
        store.getState().setLoading(false);
      });

    return () => {
      aborted = true;
      abortController.abort();
    };
  }, [
    dataSource,
    store,
    state.view.sort,
    state.view.filters,
    state.view.globalSearch,
    state.view.groupBy,
    state.pagination.pageIndex,
    state.pagination.pageSize
  ]);

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
    const allColumnIds = current.view.columns.map(
      (c: ColumnConfig<Row>) => c.id
    );
    let nextOrder =
      persisted.columnsOrder && persisted.columnsOrder.length > 0
        ? [...persisted.columnsOrder]
        : current.view.columnsOrder && current.view.columnsOrder.length > 0
          ? [...(current.view.columnsOrder as string[])]
          : [...allColumnIds];

    // 过滤掉已经不存在的列
    nextOrder = nextOrder.filter((columnId: string) =>
      allColumnIds.includes(columnId)
    );
    // 把新增列 append 到末尾
    allColumnIds.forEach((columnId: string) => {
      if (!nextOrder.includes(columnId)) nextOrder.push(columnId);
    });

    // 只覆盖视图中和列相关的配置，保留其它状态；
    // 对于新增列，如果持久化里没有记录，则使用当前视图（通常来自 initialViewState）的默认值。
    if (nextOrder.length > 0) {
      store.getState().setColumnsOrder(nextOrder);
    }
    if (persisted.columnsWidth) {
      Object.entries(persisted.columnsWidth).forEach(([columnId, width]) => {
        store.getState().setColumnWidth(columnId, width);
      });
    }
    if (persisted.columnsVisibility) {
      Object.entries(persisted.columnsVisibility).forEach(
        ([columnId, visible]) => {
          store.getState().setColumnVisibility(columnId, visible);
        }
      );
    }
    if (persisted.columnsPinned) {
      Object.entries(persisted.columnsPinned).forEach(([columnId, pinned]) => {
        store.getState().setColumnPinned(columnId, pinned);
      });
    }
  }, [enableColumnPersistence, loadColumnState, store]);

  return { state, store };
}
