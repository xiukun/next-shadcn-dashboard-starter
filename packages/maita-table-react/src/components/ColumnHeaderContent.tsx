'use client';

import * as React from 'react';
// 使用 SVG 图标，避免依赖 lucide-react
const MoreVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
    />
  </svg>
);
import { SortIndicator, type SortDirection } from './SortIndicator';
import { cn } from '../utils';

export interface ColumnHeaderContentProps {
  /**
   * 列标题
   */
  title: React.ReactNode;
  /**
   * 是否启用排序
   */
  enableSorting?: boolean;
  /**
   * 当前排序方向
   */
  sortDirection?: SortDirection;
  /**
   * 排序优先级（多列排序）
   */
  sortPriority?: number;
  /**
   * 是否启用过滤
   */
  enableFiltering?: boolean;
  /**
   * 是否有过滤条件
   */
  hasFilter?: boolean;
  /**
   * 点击列标题时的回调（用于排序）
   */
  onSortClick?: (e: React.MouseEvent) => void;
  /**
   * 点击排序指示器时的回调
   */
  onSortIndicatorClick?: (e: React.MouseEvent) => void;
  /**
   * 点击过滤指示器时的回调
   */
  onFilterClick?: (e: React.MouseEvent) => void;
  /**
   * 点击菜单按钮时的回调
   */
  onMenuClick?: (e: React.MouseEvent) => void;
  /**
   * 自定义 className
   */
  className?: string;
}

export function ColumnHeaderContent(props: ColumnHeaderContentProps) {
  const {
    title,
    enableSorting,
    sortDirection,
    sortPriority,
    enableFiltering,
    hasFilter,
    onSortClick,
    onSortIndicatorClick,
    onFilterClick,
    onMenuClick,
    className
  } = props;

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      {/* 列标题 - 可点击排序 */}
      <button
        type='button'
        onClick={enableSorting ? onSortClick : undefined}
        className={cn(
          'flex-1 text-left',
          enableSorting && 'hover:text-foreground cursor-pointer'
        )}
        disabled={!enableSorting}
      >
        {title}
      </button>

      {/* 操作按钮组 */}
      <div className='flex items-center gap-0.5'>
        {/* 排序指示器 */}
        {enableSorting && (
          <SortIndicator
            direction={sortDirection ?? null}
            priority={sortPriority}
            onClick={onSortIndicatorClick}
          />
        )}

        {/* 过滤指示器 */}
        {enableFiltering && (
          <button
            type='button'
            onClick={onFilterClick}
            className={cn(
              'text-muted-foreground hover:text-foreground flex items-center rounded px-1.5 py-0.5 transition-colors',
              hasFilter && 'text-primary'
            )}
            aria-label='过滤'
            title='点击过滤'
          >
            <svg
              className='size-3'
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
          </button>
        )}

        {/* 菜单按钮 */}
        <button
          type='button'
          onClick={onMenuClick}
          className='text-muted-foreground hover:text-foreground flex items-center rounded px-1.5 py-0.5 opacity-0 transition-opacity group-hover:opacity-100'
          aria-label='更多选项'
          title='更多选项'
        >
          <MoreVerticalIcon className='size-3.5' />
        </button>
      </div>
    </div>
  );
}
