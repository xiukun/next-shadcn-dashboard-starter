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
  className?: string; // 添加 className 支持，用于传递行的样式类
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

  // 确保固定列始终有背景色，完全遮挡底层内容
  // 选中状态：使用 primary/10，未选中状态：使用 background
  // 使用 color-mix 来混合颜色，确保背景色不透明
  const baseBackgroundColor = isSelected
    ? 'color-mix(in oklch, var(--primary) 10%, var(--background))' // 选中行：使用 primary 颜色的浅色背景
    : 'var(--background)'; // 未选中行：使用默认背景，确保不透明

  return (
    <td
      className='mt-grid-td px-2 py-2 align-middle'
      style={{
        ...style,
        position: 'sticky',
        left: 0,
        width: 48, // 固定宽度48px，确保与表头和leftOffset计算一致
        minWidth: 48,
        maxWidth: 48,
        zIndex: 30, // 高于普通数据行，但低于表头固定列
        // 确保背景色始终存在且不透明，完全遮挡底层内容
        backgroundColor: baseBackgroundColor,
        // 添加右侧阴影，视觉上区分固定列和非固定列
        boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)',
        // 确保背景色在 hover 时也能正确显示
        transition: 'background-color 0.15s ease-in-out'
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='gridcell'
      tabIndex={0}
      onMouseEnter={(e) => {
        // hover 时，如果未选中，使用 muted/40；如果已选中，使用 primary/20
        const hoverBg = isSelected
          ? 'color-mix(in oklch, var(--primary) 20%, var(--background))'
          : 'color-mix(in oklch, var(--muted) 40%, var(--background))';
        (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        // 离开时恢复原始背景色
        (e.currentTarget as HTMLElement).style.backgroundColor =
          baseBackgroundColor;
      }}
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
        aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
        suppressHydrationWarning
      />
    );
  };

  return (
    <th
      className='mt-grid-th px-2 py-2 text-center'
      style={{
        position: 'sticky',
        left: 0,
        top: 0,
        width: 48, // 固定宽度48px，确保与leftOffset计算一致
        minWidth: 48,
        maxWidth: 48,
        zIndex: 50, // 最高层级，确保在所有固定列之上
        backgroundColor: 'var(--muted)', // 使用var()直接引用，兼容lab()格式
        // 添加右侧阴影，视觉上区分固定列和非固定列
        boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)',
        // 确保点击事件不会穿透
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        // 阻止事件冒泡，确保点击的是表头checkbox而不是下面的行
        e.stopPropagation();
        handleClick(e);
      }}
      onKeyDown={handleKeyDown}
      role='columnheader'
      tabIndex={0}
      aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
    >
      <div
        className='flex items-center justify-center'
        onClick={(e) => {
          // 在内部div也阻止冒泡，双重保险
          e.stopPropagation();
        }}
      >
        {renderCheckbox()}
      </div>
    </th>
  );
}
