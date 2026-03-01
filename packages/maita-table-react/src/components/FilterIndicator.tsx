'use client';

import * as React from 'react';
import { cn } from '../utils';

export interface FilterIndicatorProps {
  /**
   * 是否有过滤条件
   */
  hasFilter: boolean;
  /**
   * 点击过滤指示器时的回调
   */
  onClick?: (e: React.MouseEvent) => void;
  /**
   * 自定义 className
   */
  className?: string;
}

export function FilterIndicator(props: FilterIndicatorProps) {
  const { hasFilter, onClick, className } = props;

  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:text-foreground flex items-center rounded px-1.5 py-0.5 transition-colors',
        hasFilter && 'text-primary',
        className
      )}
      aria-label='过滤'
      title={hasFilter ? '有过滤条件，点击查看/编辑' : '点击过滤'}
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
      {hasFilter && (
        <span className='bg-primary absolute -top-0.5 -right-0.5 size-1.5 rounded-full' />
      )}
    </button>
  );
}
