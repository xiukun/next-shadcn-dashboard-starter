'use client';

import * as React from 'react';
import type { RowKey } from '@maita-table/core';
import type { UseRowSelectionResult } from '../hooks/useRowSelection';

export interface SelectionCheckboxProps {
  rowKey: RowKey;
  isSelected: boolean;
  selection: UseRowSelectionResult;
  onToggle: (event?: React.MouseEvent) => void;
  style?: React.CSSProperties;
  CheckboxComponent?: React.ComponentType<{
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    'aria-checked'?: boolean | 'mixed';
  }>;
}

export function SelectionCheckbox(props: SelectionCheckboxProps) {
  const { rowKey, isSelected, onToggle, style, CheckboxComponent } = props;

  // 客户端 hydration 状态：避免 SSR 和客户端状态不一致导致的 hydration 警告
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }
  };

  // 如果没有传入 CheckboxComponent，使用原生 checkbox
  const renderCheckbox = () => {
    if (CheckboxComponent) {
      // 使用 div 包装并添加 suppressHydrationWarning，避免修改 shadcn/ui 组件
      return (
        <div suppressHydrationWarning>
          <CheckboxComponent
            checked={isMounted ? isSelected : false}
            onCheckedChange={(checked) => {
              // CheckboxComponent 的 onCheckedChange 接收 boolean，但我们不需要事件对象
              if (checked !== isSelected) {
                onToggle();
              }
            }}
          />
        </div>
      );
    }

    // 原生 checkbox 实现
    return (
      <input
        type='checkbox'
        checked={isMounted ? isSelected : false}
        onChange={() => onToggle()}
        className='border-input size-4 cursor-pointer rounded'
        aria-checked={isSelected}
        suppressHydrationWarning
      />
    );
  };

  return (
    <td
      className='mt-grid-td bg-background sticky left-0 z-20 w-12 px-2 py-2 align-middle'
      style={{
        ...style,
        position: 'sticky',
        left: 0,
        zIndex: 20,
        backgroundColor: 'hsl(var(--background))'
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='gridcell'
      tabIndex={0}
    >
      <div className='flex items-center justify-center'>{renderCheckbox()}</div>
    </td>
  );
}

export interface HeaderSelectionCheckboxProps {
  allRowKeys: RowKey[];
  selection: UseRowSelectionResult;
  onToggleAll: () => void;
  CheckboxComponent?: React.ComponentType<{
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    'aria-checked'?: boolean | 'mixed';
  }>;
}

export function HeaderSelectionCheckbox(props: HeaderSelectionCheckboxProps) {
  const { allRowKeys, selection, onToggleAll, CheckboxComponent } = props;

  // 客户端 hydration 状态：避免 SSR 和客户端状态不一致导致的 hydration 警告
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 仅统计当前 key 集合中的选中数量（对应"当前页全选"语义）
  const selectedCount = selection.getSelectedCountForKeys(allRowKeys);
  const totalCount = allRowKeys.length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleAll();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onToggleAll();
    }
  };

  // 如果没有传入 CheckboxComponent，使用原生 checkbox
  const renderCheckbox = () => {
    if (CheckboxComponent) {
      // 使用 div 包装并添加 suppressHydrationWarning，避免修改 shadcn/ui 组件
      return (
        <div suppressHydrationWarning>
          <CheckboxComponent
            checked={isMounted ? isAllSelected : false}
            aria-checked={
              isMounted ? (isIndeterminate ? 'mixed' : isAllSelected) : false
            }
            onCheckedChange={onToggleAll}
          />
        </div>
      );
    }

    // 原生 checkbox 实现（支持 indeterminate）
    return (
      <input
        type='checkbox'
        checked={isMounted ? isAllSelected : false}
        ref={(el) => {
          if (el && isMounted) {
            el.indeterminate = isIndeterminate;
          }
        }}
        onChange={onToggleAll}
        className='border-input size-4 cursor-pointer rounded'
        aria-checked={
          isMounted ? (isIndeterminate ? 'mixed' : isAllSelected) : false
        }
        aria-label={isAllSelected ? '取消全选' : '全选'}
        suppressHydrationWarning
      />
    );
  };

  return (
    <th
      className='mt-grid-th w-12 px-2 py-2 text-center'
      style={{
        position: 'sticky',
        left: 0,
        top: 0,
        zIndex: 40, // 高于表头固定列（z-30），确保在最上层
        backgroundColor: 'hsl(var(--muted) / 0.4)'
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='columnheader'
      tabIndex={0}
      aria-label={isAllSelected ? '取消全选' : '全选'}
    >
      <div className='flex items-center justify-center'>{renderCheckbox()}</div>
    </th>
  );
}
