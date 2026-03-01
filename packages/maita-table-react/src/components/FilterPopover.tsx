'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { FilterMenu } from './FilterMenu';
import type { UseColumnFilteringResult } from '../hooks/useColumnFiltering';
import type { FilterOperator } from '@maita-table/core';
import { cn } from '../utils';

export interface FilterPopoverProps {
  /**
   * 列 ID
   */
  columnId: string;
  /**
   * 过滤器类型
   */
  filterType: 'text' | 'number' | 'date';
  /**
   * 过滤功能 Hook
   */
  filtering: UseColumnFilteringResult;
  /**
   * 是否打开
   */
  open?: boolean;
  /**
   * 打开状态变化回调
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * 触发元素的引用（用于定位 Popover）
   */
  triggerRef?: React.RefObject<HTMLElement>;
}

export function FilterPopover(props: FilterPopoverProps) {
  const { columnId, filterType, filtering, open, onOpenChange, triggerRef } =
    props;

  const currentValue = filtering.getFilterValue(columnId);
  const currentOperator = filtering.getFilterOperator(columnId);

  if (!open) {
    return null;
  }

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
            'bg-popover text-popover-foreground z-50 w-72 rounded-md border shadow-md outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          <FilterMenu
            columnId={columnId}
            filterType={filterType}
            filtering={filtering}
            currentValue={currentValue}
            currentOperator={currentOperator}
            onClose={() => onOpenChange?.(false)}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
