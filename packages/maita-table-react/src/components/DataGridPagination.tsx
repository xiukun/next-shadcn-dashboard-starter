'use client';

import * as React from 'react';
// 注意：这些 UI 组件需要在使用 DataGrid 的应用中提供
// 或者我们可以使用更简单的原生 HTML 元素
// 暂时使用原生元素，避免依赖外部 UI 库
import type { UseTablePaginationResult } from '../hooks/useTablePagination';

export interface DataGridPaginationProps {
  pagination: UseTablePaginationResult;
  /**
   * 每页条数选项（默认 [10, 20, 50, 100]）
   */
  pageSizeOptions?: number[];
  /**
   * 是否显示总行数（默认 false）
   */
  showRowCount?: boolean;
}

export function DataGridPagination(props: DataGridPaginationProps) {
  const {
    pagination,
    pageSizeOptions = [10, 20, 50, 100],
    showRowCount = false
  } = props;

  const {
    pageIndex,
    pageSize,
    pageCount,
    rowCount,
    canPreviousPage,
    canNextPage,
    firstPage,
    previousPage,
    nextPage,
    lastPage,
    setPageIndex,
    setPageSize
  } = pagination;

  return (
    <div className='flex items-center justify-between px-2 py-2'>
      <div className='flex items-center gap-2'>
        <button
          onClick={firstPage}
          disabled={!canPreviousPage}
          className='hover:bg-accent rounded-md border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='首页'
        >
          {'<<'}
        </button>
        <button
          onClick={previousPage}
          disabled={!canPreviousPage}
          className='hover:bg-accent rounded-md border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='上一页'
        >
          {'<'}
        </button>
        <span className='text-muted-foreground text-sm'>
          第 {pageIndex + 1} 页
          {pageCount !== undefined && ` / 共 ${pageCount} 页`}
        </span>
        <button
          onClick={nextPage}
          disabled={!canNextPage}
          className='hover:bg-accent rounded-md border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='下一页'
        >
          {'>'}
        </button>
        <button
          onClick={lastPage}
          disabled={!canNextPage}
          className='hover:bg-accent rounded-md border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='末页'
        >
          {'>>'}
        </button>
        {showRowCount && rowCount !== undefined && (
          <span className='text-muted-foreground text-sm'>
            共 {rowCount} 条
          </span>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-sm'>每页</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className='hover:bg-accent bg-background rounded-md border px-3 py-1.5 text-xs'
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className='text-muted-foreground text-sm'>条</span>
      </div>
    </div>
  );
}
