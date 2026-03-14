'use client';

import * as React from 'react';
import { flexRender } from '@tanstack/react-table';
import type { HeaderGroup } from '@tanstack/react-table';
import type { ColumnConfig, RowKey } from '@maita-table/core';
import { ColumnHeader } from './ColumnHeader';
import { FloatingFilter } from './FloatingFilter';
import { FilterPopover } from './FilterPopover';
import { ColumnMenu, type ColumnMenuLabels } from './ColumnMenu';
import { HeaderSelectionCheckbox } from './SelectionCheckbox';
import type { DataGridStore } from '../store';
import type { UseColumnSortingResult } from '../hooks/useColumnSorting';
import type { UseColumnFilteringResult } from '../hooks/useColumnFiltering';
import type { UseRowSelectionResult } from '../hooks/useRowSelection';

export interface DataGridHeaderProps<Row> {
  headerGroups: HeaderGroup<Row>[];
  allVisibleColumns: ColumnConfig<Row>[];
  store: DataGridStore<Row>;
  enableRowSelection: boolean;
  currentPageRowKeys: RowKey[];
  selection: UseRowSelectionResult;
  sorting: UseColumnSortingResult;
  filtering: UseColumnFilteringResult;
  onToggleAll: () => void;
  onColumnResize: (columnId: string) => void;
  onColumnPinnedChange: (
    columnId: string,
    pinned: 'left' | 'right' | undefined
  ) => void;
  showHeaderVerticalDividers: boolean;
  CheckboxComponent?: React.ComponentType<{
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    'aria-checked'?: boolean | 'mixed';
  }>;
  columnMenuLabels?: ColumnMenuLabels;
  // 菜单打开状态管理
  filterMenuOpenMap: Record<string, boolean>;
  setFilterMenuOpenMap: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  columnMenuOpenMap: Record<string, boolean>;
  setColumnMenuOpenMap: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  columnMenuButtonRefs: React.MutableRefObject<
    Map<string, React.RefObject<HTMLButtonElement | null>>
  >;
  filterButtonRefs: React.MutableRefObject<
    Map<string, React.RefObject<HTMLButtonElement | null>>
  >;
}

export function DataGridHeader<Row>(props: DataGridHeaderProps<Row>) {
  const {
    headerGroups,
    allVisibleColumns,
    store,
    enableRowSelection,
    currentPageRowKeys,
    selection,
    sorting,
    filtering,
    onToggleAll,
    onColumnResize,
    onColumnPinnedChange,
    showHeaderVerticalDividers,
    CheckboxComponent,
    columnMenuLabels,
    filterMenuOpenMap,
    setFilterMenuOpenMap,
    columnMenuOpenMap,
    setColumnMenuOpenMap,
    columnMenuButtonRefs,
    filterButtonRefs
  } = props;

  const state = store.getState();
  const viewState = state.view;

  return (
    <thead className='mt-grid-thead bg-muted/40 sticky top-0 z-10 backdrop-blur'>
      {headerGroups.map((headerGroup) => (
        <React.Fragment key={headerGroup.id}>
          <tr className='mt-grid-tr border-b'>
            {/* 选择列的表头 checkbox */}
            {enableRowSelection && (
              <HeaderSelectionCheckbox
                allRowKeys={currentPageRowKeys}
                selection={selection}
                onToggleAll={onToggleAll}
                CheckboxComponent={CheckboxComponent}
              />
            )}
            {headerGroup.headers.map((header, headerIndex) => {
              const columnId = header.column.id;
              const width = viewState.columnsWidth?.[columnId];
              const pinned = viewState.columnsPinned?.[columnId];
              const column = allVisibleColumns.find((c) => c.id === columnId);

              // 计算当前列之前的左固定列宽度
              let leftOffset = enableRowSelection ? 48 : 0;
              for (let i = 0; i < headerIndex; i++) {
                const prevHeader = headerGroup.headers[i];
                if (prevHeader) {
                  const prevPinned =
                    viewState.columnsPinned?.[prevHeader.column.id];
                  if (prevPinned === 'left') {
                    const prevCol = allVisibleColumns.find(
                      (c) => c.id === prevHeader.column.id
                    );
                    const prevWidth =
                      viewState.columnsWidth?.[prevHeader.column.id] ??
                      (typeof prevCol?.width === 'number'
                        ? prevCol.width
                        : 150);
                    leftOffset +=
                      typeof prevWidth === 'number' ? prevWidth : 150;
                  }
                }
              }

              // 计算当前列之后的右固定列宽度
              let rightOffset = 0;
              for (
                let i = headerIndex + 1;
                i < headerGroup.headers.length;
                i++
              ) {
                const nextHeader = headerGroup.headers[i];
                if (nextHeader) {
                  const nextPinned =
                    viewState.columnsPinned?.[nextHeader.column.id];
                  if (nextPinned === 'right') {
                    const nextCol = allVisibleColumns.find(
                      (c) => c.id === nextHeader.column.id
                    );
                    const nextWidth =
                      viewState.columnsWidth?.[nextHeader.column.id] ??
                      (typeof nextCol?.width === 'number'
                        ? nextCol.width
                        : 150);
                    rightOffset +=
                      typeof nextWidth === 'number' ? nextWidth : 150;
                  }
                }
              }

              if (!column) {
                return null;
              }

              const sortDirection = sorting.getSortDirection(columnId);
              const sortPriority = sorting.getSortPriority(columnId);
              const hasFilter = filtering.hasFilter(columnId);
              const meta = column.meta;
              const enableFloatingFilter = meta?.enableFloatingFilter ?? false;
              const filterType =
                (meta?.filterType as 'text' | 'number' | 'date') || 'text';
              const filterMenuOpen = filterMenuOpenMap[columnId] || false;
              const setFilterMenuOpen = (open: boolean) => {
                setFilterMenuOpenMap((prev) => ({
                  ...prev,
                  [columnId]: open
                }));
              };

              const columnMenuOpen = columnMenuOpenMap[columnId] || false;
              const setColumnMenuOpen = (open: boolean) => {
                setColumnMenuOpenMap((prev) => ({
                  ...prev,
                  [columnId]: open
                }));
              };

              // 菜单按钮的 ref
              if (!columnMenuButtonRefs.current.has(columnId)) {
                columnMenuButtonRefs.current.set(
                  columnId,
                  React.createRef<HTMLButtonElement>()
                );
              }
              const menuButtonRef = columnMenuButtonRefs.current.get(columnId)!;

              // 过滤按钮的 ref
              if (!filterButtonRefs.current.has(columnId)) {
                filterButtonRefs.current.set(
                  columnId,
                  React.createRef<HTMLButtonElement>()
                );
              }
              const filterButtonRef = filterButtonRefs.current.get(columnId)!;

              // 处理浮动过滤器值变化
              const handleFloatingFilterChange = (value: string) => {
                let operator: 'contains' | 'gt' | 'lt' | 'eq' = 'contains';
                if (filterType === 'number') {
                  operator = 'gt';
                } else if (filterType === 'date') {
                  operator = 'eq';
                }
                filtering.setFilter(columnId, operator, value);
              };

              return (
                <ColumnHeader
                  key={header.id}
                  column={column}
                  header={
                    header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                  }
                  columnId={columnId}
                  width={width}
                  pinned={pinned}
                  leftOffset={leftOffset}
                  rightOffset={rightOffset}
                  showVerticalDividers={showHeaderVerticalDividers}
                  sortDirection={sortDirection}
                  sortPriority={sortPriority}
                  onSortClick={(e) => sorting.toggleSort(columnId, e)}
                  onSortIndicatorClick={(e) => sorting.toggleSort(columnId, e)}
                  hasFilter={hasFilter}
                  onFilterClick={() => {
                    setFilterMenuOpen(true);
                  }}
                  onMenuClick={() => {
                    setColumnMenuOpen(true);
                  }}
                  onColumnResize={onColumnResize}
                  menuButtonRef={
                    menuButtonRef as React.RefObject<HTMLButtonElement>
                  }
                  filterButtonRef={
                    filterButtonRef as React.RefObject<HTMLButtonElement>
                  }
                />
              );
            })}
          </tr>
          {/* 浮动过滤器行 */}
          {headerGroup.headers.some((header) => {
            const colId = header.column.id;
            const col = allVisibleColumns.find((c) => c.id === colId);
            const colMeta = col?.meta;
            return (
              colMeta?.enableFloatingFilter &&
              (colMeta?.enableFiltering ?? col?.enableFiltering)
            );
          }) && (
            <tr className='mt-grid-tr border-b'>
              {enableRowSelection && <td className='w-12' />}
              {headerGroup.headers.map((header) => {
                const columnId = header.column.id;
                const column = allVisibleColumns.find((c) => c.id === columnId);
                if (!column) return <td key={header.id} />;
                const meta = column.meta;
                const enableFloatingFilter =
                  meta?.enableFloatingFilter ?? false;
                const filterType =
                  (meta?.filterType as 'text' | 'number' | 'date') || 'text';

                const handleFloatingFilterChange = (value: string) => {
                  let operator: 'contains' | 'gt' | 'lt' | 'eq' = 'contains';
                  if (filterType === 'number') {
                    operator = 'gt';
                  } else if (filterType === 'date') {
                    operator = 'eq';
                  }
                  filtering.setFilter(columnId, operator, value);
                };

                const width = viewState.columnsWidth?.[columnId];
                const pinned = viewState.columnsPinned?.[columnId];

                // 计算固定列偏移量
                let leftOffset = enableRowSelection ? 48 : 0;
                let rightOffset = 0;
                const headerIndex = headerGroup.headers.findIndex(
                  (h) => h.id === header.id
                );

                for (let i = 0; i < headerIndex; i++) {
                  const prevHeader = headerGroup.headers[i];
                  if (prevHeader) {
                    const prevPinned =
                      viewState.columnsPinned?.[prevHeader.column.id];
                    if (prevPinned === 'left') {
                      const prevCol = allVisibleColumns.find(
                        (c) => c.id === prevHeader.column.id
                      );
                      const prevWidth =
                        viewState.columnsWidth?.[prevHeader.column.id] ??
                        (typeof prevCol?.width === 'number'
                          ? prevCol.width
                          : 150);
                      leftOffset +=
                        typeof prevWidth === 'number' ? prevWidth : 150;
                    }
                  }
                }

                for (
                  let i = headerIndex + 1;
                  i < headerGroup.headers.length;
                  i++
                ) {
                  const nextHeader = headerGroup.headers[i];
                  if (nextHeader) {
                    const nextPinned =
                      viewState.columnsPinned?.[nextHeader.column.id];
                    if (nextPinned === 'right') {
                      const nextCol = allVisibleColumns.find(
                        (c) => c.id === nextHeader.column.id
                      );
                      const nextWidth =
                        viewState.columnsWidth?.[nextHeader.column.id] ??
                        (typeof nextCol?.width === 'number'
                          ? nextCol.width
                          : 150);
                      rightOffset +=
                        typeof nextWidth === 'number' ? nextWidth : 150;
                    }
                  }
                }

                const stickyStyle: React.CSSProperties = {
                  ...(width ? { width, minWidth: width, maxWidth: width } : {}),
                  ...(pinned === 'left'
                    ? {
                        position: 'sticky',
                        left: leftOffset,
                        top: 0,
                        zIndex: 30,
                        backgroundColor: 'var(--muted)',
                        boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)'
                      }
                    : pinned === 'right'
                      ? {
                          position: 'sticky',
                          right: rightOffset,
                          top: 0,
                          zIndex: 30,
                          backgroundColor: 'var(--muted)',
                          boxShadow: '-2px 0 4px -2px rgba(0, 0, 0, 0.1)'
                        }
                      : {})
                };

                return (
                  <td key={header.id} className='p-0' style={stickyStyle}>
                    {enableFloatingFilter &&
                      (meta?.enableFiltering ?? column.enableFiltering) && (
                        <FloatingFilter
                          columnId={columnId}
                          filterType={filterType}
                          placeholder={meta?.filterPlaceholder}
                          value={
                            filtering.getFilterValue(columnId) as
                              | string
                              | undefined
                          }
                          onValueChange={handleFloatingFilterChange}
                        />
                      )}
                  </td>
                );
              })}
            </tr>
          )}
          {/* 过滤菜单 Popover */}
          {headerGroup.headers.map((header) => {
            const columnId = header.column.id;
            const column = allVisibleColumns.find((c) => c.id === columnId);
            if (!column) return null;
            const meta = column.meta;
            const filterType =
              (meta?.filterType as 'text' | 'number' | 'date') || 'text';
            const filterMenuOpen = filterMenuOpenMap[columnId] || false;
            const setFilterMenuOpen = (open: boolean) => {
              setFilterMenuOpenMap((prev) => ({
                ...prev,
                [columnId]: open
              }));
            };

            const filterButtonRef = filterButtonRefs.current.get(columnId);

            return (meta?.enableFiltering ?? column.enableFiltering) ? (
              <FilterPopover
                key={`filter-${columnId}`}
                columnId={columnId}
                filterType={filterType}
                filtering={filtering}
                open={filterMenuOpen}
                onOpenChange={setFilterMenuOpen}
                triggerRef={filterButtonRef as React.RefObject<HTMLElement>}
              />
            ) : null;
          })}
          {/* 列菜单 Popover */}
          {headerGroup.headers.map((header) => {
            const columnId = header.column.id;
            const column = allVisibleColumns.find((c) => c.id === columnId);
            if (!column) return null;
            const pinned = viewState.columnsPinned?.[columnId];
            const sortDirection = sorting.getSortDirection(columnId);
            const hasFilter = filtering.hasFilter(columnId);
            const columnMenuOpen = columnMenuOpenMap[columnId] || false;
            const setColumnMenuOpen = (open: boolean) => {
              setColumnMenuOpenMap((prev) => ({
                ...prev,
                [columnId]: open
              }));
            };

            const filterMenuOpen = filterMenuOpenMap[columnId] || false;
            const setFilterMenuOpen = (open: boolean) => {
              setFilterMenuOpenMap((prev) => ({
                ...prev,
                [columnId]: open
              }));
            };

            const columnTitle =
              typeof column.header === 'string'
                ? column.header
                : (column.header as any)?.toString?.() || columnId;

            const menuButtonRef = columnMenuButtonRefs.current.get(columnId);

            return (
              <ColumnMenu
                key={`menu-${columnId}`}
                columnId={columnId}
                columnTitle={columnTitle}
                enableSorting={column.enableSorting}
                enableFiltering={
                  column.meta?.enableFiltering ?? column.enableFiltering
                }
                sortDirection={sortDirection}
                hasFilter={hasFilter}
                pinned={pinned}
                sorting={sorting}
                filtering={filtering}
                open={columnMenuOpen}
                onOpenChange={setColumnMenuOpen}
                onPinColumn={onColumnPinnedChange}
                onAutoResize={onColumnResize}
                onOpenFilter={() => {
                  setFilterMenuOpen(true);
                  setColumnMenuOpen(false);
                }}
                triggerRef={menuButtonRef}
                labels={columnMenuLabels}
              />
            );
          })}
        </React.Fragment>
      ))}
    </thead>
  );
}
