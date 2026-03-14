'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type TableOptions
} from '@tanstack/react-table';
import type { DataGridStore } from '../store';

export interface UseTableInstanceOptions<Row> {
  store: DataGridStore<Row>;
  columns: ColumnDef<Row>[];
  /**
   * 是否启用客户端分页（默认 false）
   */
  enablePagination?: boolean;
  /**
   * 分页模式：'client' 客户端分页，'server' 服务端分页（默认 'client'）
   */
  paginationMode?: 'client' | 'server';
  /**
   * 总行数（服务端分页时必需）
   */
  rowCount?: number;
  /**
   * 总页数（服务端分页时可选）
   */
  pageCount?: number;
  /**
   * 分组行是否默认展开（默认 true）
   */
  defaultGroupExpanded?: boolean;
}

/**
 * 管理 TanStack Table 实例
 */
export function useTableInstance<Row>(options: UseTableInstanceOptions<Row>) {
  const {
    store,
    columns,
    enablePagination = false,
    paginationMode = 'client',
    rowCount,
    pageCount,
    defaultGroupExpanded = true
  } = options;

  // 订阅状态变化
  const viewState = store((state) => state.view);
  const paginationState = store((state) => state.pagination);
  const dataRows = store((state) => state.data.rows);

  // 分组状态（目前仅支持按列 ID 分组，顺序与 GroupState 一致）
  const grouping = useMemo(() => {
    return viewState.groupBy ?? [];
  }, [viewState.groupBy]);

  // 将排序状态转换为 TanStack Table 格式
  const tanStackSorting = useMemo(() => {
    return (
      viewState.sort?.map((s) => ({
        id: s.id,
        desc: s.desc
      })) || []
    );
  }, [viewState.sort]);

  // 将过滤状态转换为 TanStack Table 格式
  const tanStackColumnFilters = useMemo(() => {
    return (
      viewState.filters?.map((f) => ({
        id: f.id,
        value: f.value
      })) || []
    );
  }, [viewState.filters]);

  // 分页状态
  const pagination = useMemo(() => {
    return {
      pageIndex: paginationState.pageIndex,
      pageSize: paginationState.pageSize
    };
  }, [paginationState]);

  // 构建 table 配置
  const tableOptions: TableOptions<Row> = {
    data: dataRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting: tanStackSorting,
      columnFilters: tanStackColumnFilters,
      grouping
    },
    // 仅用于设置“默认”展开状态，后续交互完全交给 TanStack Table 内部管理
    initialState: defaultGroupExpanded ? { expanded: true } : {},
    onSortingChange: () => {
      // 排序状态通过 useColumnSorting hook 管理
      // TanStack Table 的排序主要用于前端计算和 UI 反馈
    },
    onColumnFiltersChange: () => {
      // 过滤状态通过 useColumnFiltering hook 管理
      // TanStack Table 的过滤主要用于前端计算和 UI 反馈
    },
    manualSorting: true, // 使用服务端排序，但允许前端计算用于 UI 反馈
    manualFiltering: true // 使用服务端过滤，但允许前端计算用于 UI 反馈
  };

  // 添加分页配置
  if (enablePagination) {
    if (paginationMode === 'client') {
      // 客户端分页
      tableOptions.getPaginationRowModel = getPaginationRowModel();
      tableOptions.manualPagination = false;
    } else {
      // 服务端分页
      tableOptions.manualPagination = true;
      if (rowCount !== undefined) {
        tableOptions.rowCount = rowCount;
      }
      if (pageCount !== undefined) {
        tableOptions.pageCount = pageCount;
      }
    }

    tableOptions.state = {
      ...tableOptions.state,
      pagination
    };

    tableOptions.onPaginationChange = (updater) => {
      const current = store.getState();
      const nextPagination =
        typeof updater === 'function'
          ? updater({
              pageIndex: current.pagination.pageIndex,
              pageSize: current.pagination.pageSize
            })
          : updater;

      if (nextPagination.pageIndex !== undefined) {
        current.setPageIndex(nextPagination.pageIndex);
      }
      if (nextPagination.pageSize !== undefined) {
        current.setPageSize(nextPagination.pageSize);
      }
    };
  }

  const table = useReactTable(tableOptions);

  return table;
}
