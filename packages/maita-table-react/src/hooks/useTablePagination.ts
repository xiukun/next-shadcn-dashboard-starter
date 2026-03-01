'use client';

import { useCallback } from 'react';
import type { DataGridStore } from '../store';

export interface UseTablePaginationOptions<Row> {
  store: DataGridStore<Row>;
  /**
   * 是否启用分页（默认 false）
   */
  enablePagination?: boolean;
  /**
   * 分页模式：'client' 客户端分页，'server' 服务端分页（默认 'client'）
   */
  paginationMode?: 'client' | 'server';
}

export interface UseTablePaginationResult {
  /**
   * 当前页码（从 0 开始）
   */
  pageIndex: number;
  /**
   * 每页条数
   */
  pageSize: number;
  /**
   * 总页数
   */
  pageCount: number | undefined;
  /**
   * 总行数
   */
  rowCount: number | undefined;
  /**
   * 是否可以上一页
   */
  canPreviousPage: boolean;
  /**
   * 是否可以下一页
   */
  canNextPage: boolean;
  /**
   * 跳转到第一页
   */
  firstPage: () => void;
  /**
   * 跳转到上一页
   */
  previousPage: () => void;
  /**
   * 跳转到下一页
   */
  nextPage: () => void;
  /**
   * 跳转到最后一页
   */
  lastPage: () => void;
  /**
   * 设置页码
   */
  setPageIndex: (pageIndex: number) => void;
  /**
   * 设置每页条数
   */
  setPageSize: (pageSize: number) => void;
}

/**
 * 管理分页逻辑
 */
export function useTablePagination<Row>(
  options: UseTablePaginationOptions<Row>
): UseTablePaginationResult {
  const {
    store,
    enablePagination = false,
    paginationMode = 'client'
  } = options;

  // 订阅分页状态
  const pagination = store((state) => state.pagination);

  // 计算总页数
  const pageCount = useCallback(() => {
    if (pagination.pageCount !== undefined) {
      return pagination.pageCount;
    }
    if (pagination.rowCount !== undefined && pagination.pageSize > 0) {
      return Math.ceil(pagination.rowCount / pagination.pageSize);
    }
    return undefined;
  }, [pagination]);

  const currentPageCount = pageCount();

  // 计算是否可以上一页/下一页
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage =
    currentPageCount !== undefined
      ? pagination.pageIndex < currentPageCount - 1
      : true; // 如果不知道总页数，假设可以继续

  const firstPage = useCallback(() => {
    store.getState().firstPage();
  }, [store]);

  const previousPage = useCallback(() => {
    if (canPreviousPage) {
      store.getState().previousPage();
    }
  }, [store, canPreviousPage]);

  const nextPage = useCallback(() => {
    if (canNextPage) {
      store.getState().nextPage();
    }
  }, [store, canNextPage]);

  const lastPage = useCallback(() => {
    if (currentPageCount !== undefined) {
      store.getState().lastPage();
    }
  }, [store, currentPageCount]);

  const setPageIndex = useCallback(
    (pageIndex: number) => {
      store.getState().setPageIndex(pageIndex);
    },
    [store]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      store.getState().setPageSize(pageSize);
    },
    [store]
  );

  return {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    pageCount: currentPageCount,
    rowCount: pagination.rowCount,
    canPreviousPage,
    canNextPage,
    firstPage,
    previousPage,
    nextPage,
    lastPage,
    setPageIndex,
    setPageSize
  };
}
