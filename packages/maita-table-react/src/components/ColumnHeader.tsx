'use client';

import * as React from 'react';
import type { ColumnConfig } from '@maita-table/core';
import { ColumnHeaderContent } from './ColumnHeaderContent';
import { cn } from '../utils';

export interface ColumnHeaderProps<Row> {
  /**
   * 列配置
   */
  column: ColumnConfig<Row>;
  /**
   * 列标题（从 header 或 columnDef 获取）
   */
  header: React.ReactNode;
  /**
   * 列 ID
   */
  columnId: string;
  /**
   * 列宽度
   */
  width?: number;
  /**
   * 列是否固定（'left' | 'right'）
   */
  pinned?: 'left' | 'right';
  /**
   * 固定列的偏移量
   */
  leftOffset?: number;
  /**
   * 固定列的右偏移量
   */
  rightOffset?: number;
  /**
   * 是否显示垂直分隔线
   */
  showVerticalDividers?: boolean;
  /**
   * 排序相关
   */
  sortDirection?: 'asc' | 'desc' | null;
  sortPriority?: number;
  onSortClick?: (e: React.MouseEvent) => void;
  onSortIndicatorClick?: (e: React.MouseEvent) => void;
  /**
   * 过滤相关
   */
  hasFilter?: boolean;
  onFilterClick?: (e: React.MouseEvent) => void;
  /**
   * 菜单相关
   */
  onMenuClick?: (e: React.MouseEvent) => void;
  /**
   * 列宽调整
   */
  onColumnResize?: (columnId: string) => void;
  /**
   * 菜单按钮的 ref（用于 Popover 定位）
   */
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
  /**
   * 过滤按钮的 ref（用于 Popover 定位）
   */
  filterButtonRef?: React.RefObject<HTMLButtonElement>;
  /**
   * 自定义 className
   */
  className?: string;
}

export function ColumnHeader<Row>(props: ColumnHeaderProps<Row>) {
  const {
    column,
    header,
    columnId,
    width,
    pinned,
    leftOffset = 0,
    rightOffset = 0,
    showVerticalDividers = false,
    sortDirection,
    sortPriority,
    onSortClick,
    onSortIndicatorClick,
    hasFilter,
    onFilterClick,
    onMenuClick,
    onColumnResize,
    menuButtonRef,
    filterButtonRef,
    className
  } = props;

  const meta = column.meta;
  const enableSorting = meta?.enableSorting ?? column.enableSorting ?? false;
  const enableFiltering =
    meta?.enableFiltering ?? column.enableFiltering ?? false;

  const stickyStyle: React.CSSProperties = {
    ...(width ? { width, minWidth: width, maxWidth: width } : {}),
    ...(pinned === 'left'
      ? {
          position: 'sticky',
          left: leftOffset,
          top: 0,
          zIndex: 40,
          backgroundColor: 'var(--muted)',
          boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)'
        }
      : pinned === 'right'
        ? {
            position: 'sticky',
            right: rightOffset,
            top: 0,
            zIndex: 40,
            backgroundColor: 'var(--muted)',
            boxShadow: '-2px 0 4px -2px rgba(0, 0, 0, 0.1)'
          }
        : {})
  };

  return (
    <th
      data-column-id={columnId}
      className={cn(
        'mt-grid-th text-muted-foreground group relative h-9 px-3 text-left text-xs font-medium',
        showVerticalDividers ? 'border-border border-r' : '',
        className
      )}
      style={stickyStyle}
    >
      <ColumnHeaderContent
        title={header}
        enableSorting={enableSorting}
        sortDirection={sortDirection}
        sortPriority={sortPriority}
        enableFiltering={enableFiltering}
        hasFilter={hasFilter}
        onSortClick={onSortClick}
        onSortIndicatorClick={onSortIndicatorClick}
        onFilterClick={onFilterClick}
        onMenuClick={onMenuClick}
        menuButtonRef={menuButtonRef}
        filterButtonRef={filterButtonRef}
      />
      {/* 列宽调整手柄 */}
      <div
        className={
          showVerticalDividers
            ? 'bg-border hover:bg-primary/60 absolute top-0 right-0 h-full w-px cursor-col-resize transition-colors'
            : 'hover:bg-primary/50 absolute top-0 right-0 h-full w-px cursor-col-resize opacity-0 transition-opacity group-hover:opacity-100'
        }
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onColumnResize) {
            onColumnResize(columnId);
          }
        }}
        title='双击自动调整列宽'
      />
    </th>
  );
}
