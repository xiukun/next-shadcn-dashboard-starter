'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { UseColumnSortingResult } from '../hooks/useColumnSorting';
import type { UseColumnFilteringResult } from '../hooks/useColumnFiltering';
import { cn } from '../utils';

export interface ColumnMenuLabels {
  /**
   * 升序排序文本
   */
  sortAsc?: string;
  /**
   * 降序排序文本
   */
  sortDesc?: string;
  /**
   * 清除排序文本
   */
  clearSort?: string;
  /**
   * 过滤文本
   */
  filter?: string;
  /**
   * 清除过滤文本
   */
  clearFilter?: string;
  /**
   * 固定到左侧文本
   */
  pinLeft?: string;
  /**
   * 固定到右侧文本
   */
  pinRight?: string;
  /**
   * 取消固定文本
   */
  unpin?: string;
  /**
   * 自动调整列宽文本
   */
  autoResizeColumn?: string;
}

export interface ColumnMenuProps {
  /**
   * 列 ID
   */
  columnId: string;
  /**
   * 列标题
   */
  columnTitle: string;
  /**
   * 是否启用排序
   */
  enableSorting?: boolean;
  /**
   * 是否启用过滤
   */
  enableFiltering?: boolean;
  /**
   * 当前排序方向
   */
  sortDirection?: 'asc' | 'desc' | null;
  /**
   * 是否有过滤条件
   */
  hasFilter?: boolean;
  /**
   * 当前列是否固定
   */
  pinned?: 'left' | 'right' | undefined;
  /**
   * 排序功能 Hook
   */
  sorting?: UseColumnSortingResult;
  /**
   * 过滤功能 Hook
   */
  filtering?: UseColumnFilteringResult;
  /**
   * 是否打开
   */
  open?: boolean;
  /**
   * 打开状态变化回调
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * 固定列回调
   */
  onPinColumn?: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  /**
   * 自动调整列宽回调
   */
  onAutoResize?: (columnId: string) => void;
  /**
   * 打开过滤菜单回调
   */
  onOpenFilter?: () => void;
  /**
   * 触发元素的引用（用于定位 Popover）
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /**
   * 自定义标签文本（用于 i18n）
   */
  labels?: ColumnMenuLabels;
}

export function ColumnMenu(props: ColumnMenuProps) {
  const {
    columnId,
    columnTitle,
    enableSorting,
    enableFiltering,
    sortDirection,
    hasFilter,
    pinned,
    sorting,
    filtering,
    open,
    onOpenChange,
    onPinColumn,
    onAutoResize,
    onOpenFilter,
    triggerRef,
    labels
  } = props;

  // 默认标签（中文）
  const defaultLabels: Required<ColumnMenuLabels> = {
    sortAsc: '升序排序',
    sortDesc: '降序排序',
    clearSort: '清除排序',
    filter: '过滤',
    clearFilter: '清除过滤',
    pinLeft: '固定到左侧',
    pinRight: '固定到右侧',
    unpin: '取消固定',
    autoResizeColumn: '自动调整列宽'
  };

  // 合并标签
  const t = { ...defaultLabels, ...labels };

  if (!open) {
    return null;
  }

  const handleSortAsc = () => {
    if (sorting) {
      const current = sorting.getSortDirection(columnId);
      if (current === 'asc') {
        // 如果已经是升序，清除排序
        sorting.clearSort();
      } else {
        // 设置为升序：先清除所有排序，再设置为升序
        sorting.clearSort();
        // 使用 toggleSort 设置为升序（第一次点击是升序）
        sorting.toggleSort(columnId);
      }
    }
    onOpenChange?.(false);
  };

  const handleSortDesc = () => {
    if (sorting) {
      const current = sorting.getSortDirection(columnId);
      if (current === 'desc') {
        // 如果已经是降序，清除排序
        sorting.clearSort();
      } else {
        // 设置为降序：先清除所有排序，再设置为升序，再切换为降序
        sorting.clearSort();
        sorting.toggleSort(columnId); // 升序
        sorting.toggleSort(columnId); // 降序
      }
    }
    onOpenChange?.(false);
  };

  const handleClearSort = () => {
    if (sorting) {
      sorting.clearSort();
    }
    onOpenChange?.(false);
  };

  const handlePinLeft = () => {
    onPinColumn?.(columnId, pinned === 'left' ? undefined : 'left');
    onOpenChange?.(false);
  };

  const handlePinRight = () => {
    onPinColumn?.(columnId, pinned === 'right' ? undefined : 'right');
    onOpenChange?.(false);
  };

  const handleAutoResize = () => {
    onAutoResize?.(columnId);
    onOpenChange?.(false);
  };

  const handleOpenFilter = () => {
    onOpenFilter?.();
    // 不关闭菜单，让用户可以在过滤菜单和列菜单之间切换
  };

  const handleClearFilter = () => {
    if (filtering) {
      filtering.clearFilter(columnId);
    }
    onOpenChange?.(false);
  };

  // 使用 virtualRef 来定位 Popover
  const virtualRef = React.useMemo(() => {
    if (!triggerRef?.current) return null;
    return {
      current: {
        getBoundingClientRect: () => triggerRef.current!.getBoundingClientRect()
      }
    } as React.RefObject<{ getBoundingClientRect: () => DOMRect }>;
  }, [triggerRef]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {virtualRef && <PopoverPrimitive.Anchor virtualRef={virtualRef} />}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align='start'
          side='bottom'
          sideOffset={4}
          className={cn(
            'bg-popover text-popover-foreground z-50 w-56 rounded-md border shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          <div className='p-1'>
            {/* 列标题 */}
            <div className='text-muted-foreground px-2 py-1.5 text-xs font-medium'>
              {columnTitle}
            </div>

            {/* 分隔线 */}
            <div className='bg-border my-1 h-px' />

            {/* 排序选项 */}
            {enableSorting && sorting && (
              <div className='space-y-0.5'>
                <button
                  type='button'
                  onClick={handleSortAsc}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm',
                    sortDirection === 'asc' &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <svg
                      className='size-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 10l7-7m0 0l7 7m-7-7v18'
                      />
                    </svg>
                    <span>{t.sortAsc}</span>
                  </div>
                </button>
                <button
                  type='button'
                  onClick={handleSortDesc}
                  className={cn(
                    'hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm',
                    sortDirection === 'desc' &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <div className='flex items-center gap-2'>
                    <svg
                      className='size-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 14l-7 7m0 0l-7-7m7 7V3'
                      />
                    </svg>
                    <span>{t.sortDesc}</span>
                  </div>
                </button>
                {sortDirection && (
                  <button
                    type='button'
                    onClick={handleClearSort}
                    className='hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm'
                  >
                    <div className='flex items-center gap-2'>
                      <svg
                        className='size-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      </svg>
                      <span>{t.clearSort}</span>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* 过滤选项 */}
            {enableFiltering && filtering && (
              <>
                {enableSorting && sorting && (
                  <div className='bg-border my-1 h-px' />
                )}
                <div className='space-y-0.5'>
                  <button
                    type='button'
                    onClick={handleOpenFilter}
                    className='hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm'
                  >
                    <div className='flex items-center gap-2'>
                      <svg
                        className='size-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                        />
                      </svg>
                      <span>{t.filter}</span>
                      {hasFilter && (
                        <span className='bg-primary ml-auto size-1.5 rounded-full' />
                      )}
                    </div>
                  </button>
                  {hasFilter && (
                    <button
                      type='button'
                      onClick={handleClearFilter}
                      className='hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <svg
                          className='size-4'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                          />
                        </svg>
                        <span>{t.clearFilter}</span>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* 列固定选项 */}
            {(enableSorting || enableFiltering) && (
              <div className='bg-border my-1 h-px' />
            )}
            <div className='space-y-0.5'>
              <button
                type='button'
                onClick={handlePinLeft}
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm',
                  pinned === 'left' && 'bg-accent text-accent-foreground'
                )}
              >
                <div className='flex items-center gap-2'>
                  <svg
                    className='size-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 19l-7-7 7-7m8 14l-7-7 7-7'
                    />
                  </svg>
                  <span>{t.pinLeft}</span>
                </div>
              </button>
              <button
                type='button'
                onClick={handlePinRight}
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm',
                  pinned === 'right' && 'bg-accent text-accent-foreground'
                )}
              >
                <div className='flex items-center gap-2'>
                  <svg
                    className='size-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 5l7 7-7 7M5 5l7 7-7 7'
                    />
                  </svg>
                  <span>{t.pinRight}</span>
                </div>
              </button>
              {pinned && (
                <button
                  type='button'
                  onClick={() => onPinColumn?.(columnId, undefined)}
                  className='hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm'
                >
                  <div className='flex items-center gap-2'>
                    <svg
                      className='size-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                    <span>{t.unpin}</span>
                  </div>
                </button>
              )}
            </div>

            {/* 列宽调整 */}
            <div className='bg-border my-1 h-px' />
            <button
              type='button'
              onClick={handleAutoResize}
              className='hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm'
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='size-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                  />
                </svg>
                <span>{t.autoResizeColumn}</span>
              </div>
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
