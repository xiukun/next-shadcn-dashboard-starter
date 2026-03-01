'use client';

import * as React from 'react';
// 使用 SVG 图标，避免依赖 lucide-react
const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d='M5 15l7-7 7 7'
    />
  </svg>
);

const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d='M19 9l-7 7-7-7'
    />
  </svg>
);
import { cn } from '../utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortIndicatorProps {
  /**
   * 当前排序方向：'asc' | 'desc' | null
   */
  direction: SortDirection;
  /**
   * 排序优先级（多列排序时显示序号）
   */
  priority?: number;
  /**
   * 点击排序指示器时的回调
   */
  onClick?: (e: React.MouseEvent) => void;
  /**
   * 自定义 className
   */
  className?: string;
}

export function SortIndicator(props: SortIndicatorProps) {
  const { direction, priority, onClick, className } = props;

  if (direction === null) {
    return (
      <button
        type='button'
        onClick={onClick}
        className={cn(
          'text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
          className
        )}
        aria-label='排序'
        title='点击排序'
      >
        <ArrowUpIcon className='size-3 opacity-40' />
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
        direction === 'asc' ? 'hover:text-primary' : 'hover:text-primary',
        className
      )}
      aria-label={direction === 'asc' ? '升序排序' : '降序排序'}
      title={direction === 'asc' ? '点击切换为降序' : '点击取消排序'}
    >
      {direction === 'asc' ? (
        <ArrowUpIcon className='size-3' />
      ) : (
        <ArrowDownIcon className='size-3' />
      )}
      {priority !== undefined && priority > 1 && (
        <span className='text-[10px] font-medium'>{priority}</span>
      )}
    </button>
  );
}
