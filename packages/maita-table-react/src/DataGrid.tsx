'use client';

import * as React from 'react';
import type { ColumnConfig, DataSource, ColumnMeta } from '@maita-table/core';
import type { DataGridViewState } from '@maita-table/core';
import { createColumnSchema } from '@maita-table/core';
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataGrid } from './useDataGrid';
import { NumberCell } from './cells/number-cell';
import { TextCell } from './cells/text-cell';
import { CheckboxCell } from './cells/checkbox-cell';
import { SubmissionControls } from './components/SubmissionControls';
import { ColumnManagementPanel } from './components/ColumnManagementPanel';
import { useDebouncedCallback } from './hooks/useDebounce';
import { useThrottledCallback } from './hooks/useThrottle';
import { useColumnPersistence } from './hooks/useColumnPersistence';
import { useColumnVirtualization } from './hooks/useColumnVirtualization';

export type EditMode = 'immediate' | 'single-row' | 'batch';

export interface DataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  estimateRowHeight?: number;
  initialViewState?: Partial<DataGridViewState<Row>>;
  editMode?: EditMode;
  onSubmit?: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  onValidationError?: (errors: Record<string, string>) => void;
  onSubmissionError?: (error: Error) => void;
  /**
   * 是否在列表头显示垂直分隔线（便于发现列边界和调整手柄）
   */
  showHeaderVerticalDividers?: boolean;
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const {
    columns,
    estimateRowHeight = 36,
    editMode = 'immediate',
    onSubmit,
    onValidationError,
    onSubmissionError,
    id,
    showHeaderVerticalDividers = false
  } = props;
  const { state, store } = useDataGrid<Row>(props);

  const [isColumnPanelOpen, setIsColumnPanelOpen] = React.useState(false);
  const { saveColumnState, clearColumnState } = useColumnPersistence({
    gridId: id
  });

  // 防抖处理编辑草稿值更新（150ms）
  const debouncedDispatchChange = useDebouncedCallback(
    (cell: { rowKey: string; columnId: string }, value: unknown) => {
      store.dispatch({
        type: 'edit/change',
        cell,
        value
      });
    },
    150
  );

  // 节流处理验证（300ms）
  const throttledValidate = useThrottledCallback(
    (
      validateFn: () => string | null,
      setErrorFn: (msg: string | null) => void
    ) => {
      const msg = validateFn();
      setErrorFn(msg);
    },
    300
  );

  // 计算实际显示的列（考虑顺序、可见性、固定位置）
  const visibleColumns = React.useMemo(() => {
    const viewState = state.view;
    const order = viewState.columnsOrder || columns.map((col) => col.id);
    const visibility = viewState.columnsVisibility || {};
    const pinned = viewState.columnsPinned || {};

    // 按顺序排列，并过滤可见性
    const ordered = order
      .map((id) => columns.find((col) => col.id === id))
      .filter((col): col is ColumnConfig<Row> => {
        if (!col) return false;
        const isVisible = visibility[col.id] ?? col.visible !== false;
        return isVisible;
      });

    // 按固定位置分组
    const leftPinned = ordered.filter((col) => pinned[col.id] === 'left');
    const rightPinned = ordered.filter((col) => pinned[col.id] === 'right');
    const center = ordered.filter(
      (col) => pinned[col.id] !== 'left' && pinned[col.id] !== 'right'
    );

    return { leftPinned, center, rightPinned, all: ordered };
  }, [columns, state.view]);

  // 当前使用的列（合并所有区域）
  const allVisibleColumns = React.useMemo(
    () => [
      ...visibleColumns.leftPinned,
      ...visibleColumns.center,
      ...visibleColumns.rightPinned
    ],
    [visibleColumns]
  );

  const columnSchemas = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    columns.forEach((col) => {
      map[col.id] = createColumnSchema(col, col.meta);
    });
    return map;
  }, [columns]);

  // 生成列定义的辅助函数
  const createColumnDefs = React.useCallback(
    (cols: ColumnConfig<Row>[]): Array<ColumnDef<Row>> => {
      return cols.map((col) => {
        return {
          id: col.id,
          header: () => col.header,
          accessorFn: (row) => col.accessor(row),
          meta: col.meta as any
        };
      });
    },
    []
  );

  // 为三个区域分别生成列定义
  const leftColumnDefs = React.useMemo(
    () => createColumnDefs(visibleColumns.leftPinned),
    [visibleColumns.leftPinned, createColumnDefs]
  );
  const centerColumnDefs = React.useMemo(
    () => createColumnDefs(visibleColumns.center),
    [visibleColumns.center, createColumnDefs]
  );
  const rightColumnDefs = React.useMemo(
    () => createColumnDefs(visibleColumns.rightPinned),
    [visibleColumns.rightPinned, createColumnDefs]
  );

  // 合并所有列定义（用于 TanStack Table）
  const columnDefs = React.useMemo<Array<ColumnDef<Row>>>(() => {
    return [...leftColumnDefs, ...centerColumnDefs, ...rightColumnDefs];
  }, [leftColumnDefs, centerColumnDefs, rightColumnDefs]);

  const table = useReactTable({
    data: state.data.rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel()
  });

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const rows = table.getRowModel().rows;

  // 监听滚动事件更新 scrollLeft
  React.useEffect(() => {
    const container = scrollContainerRef.current || parentRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollLeft(container.scrollLeft);
      setContainerWidth(container.clientWidth);
    };

    handleScroll(); // 初始设置
    container.addEventListener('scroll', handleScroll);
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  // 列虚拟化（仅对中间滚动区域，当列数超过20时启用）
  const shouldVirtualizeColumns = visibleColumns.center.length > 20;
  const columnVirtualization = useColumnVirtualization({
    columns: shouldVirtualizeColumns ? visibleColumns.center : [],
    columnsWidth: state.view.columnsWidth,
    scrollLeft,
    containerWidth: containerWidth || 800,
    defaultColumnWidth: 150,
    overscan: 2
  });

  // 计算左固定列的总宽度（用于 sticky 定位）
  const leftPinnedWidth = React.useMemo(() => {
    return visibleColumns.leftPinned.reduce((sum, col) => {
      const width =
        state.view.columnsWidth?.[col.id] ??
        (typeof col.width === 'number' ? col.width : 150);
      return sum + (typeof width === 'number' ? width : 150);
    }, 0);
  }, [visibleColumns.leftPinned, state.view.columnsWidth]);

  // 计算右固定列的总宽度（用于 sticky 定位）
  const rightPinnedWidth = React.useMemo(() => {
    return visibleColumns.rightPinned.reduce((sum, col) => {
      const width =
        state.view.columnsWidth?.[col.id] ??
        (typeof col.width === 'number' ? col.width : 150);
      return sum + (typeof width === 'number' ? width : 150);
    }, 0);
  }, [visibleColumns.rightPinned, state.view.columnsWidth]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 12
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1]!.end
      : 0;

  const findNextEditableCellIndex = (
    direction: 'next' | 'prev',
    rowIndex: number,
    columnIndex: number
  ): { rowIndex: number; columnIndex: number } | null => {
    const rowCount = rows.length;
    const colCount = allVisibleColumns.length;

    let r = rowIndex;
    let c = columnIndex;

    // 最多遍历整张表一次，避免死循环
    for (let steps = 0; steps < rowCount * colCount; steps++) {
      if (direction === 'next') {
        c++;
        if (c >= colCount) {
          c = 0;
          r++;
          if (r >= rowCount) return null;
        }
      } else {
        c--;
        if (c < 0) {
          c = colCount - 1;
          r--;
          if (r < 0) return null;
        }
      }

      const nextColumn = allVisibleColumns[c];
      const meta = nextColumn.meta as ColumnMeta<Row> | undefined;
      if (meta?.editable) {
        return { rowIndex: r, columnIndex: c };
      }
    }

    return null;
  };

  const handleTbodyClick = (e: React.MouseEvent<HTMLTableSectionElement>) => {
    // 如果点击的是 tbody 本身（不是单元格），取消当前编辑
    if (e.target === e.currentTarget) {
      const current = store.getState();
      if (current.runtime.editingCell) {
        store.dispatch({
          type: 'edit/cancel',
          cell: {
            rowKey: current.runtime.editingCell.rowKey,
            columnId: current.runtime.editingCell.columnId
          }
        });
      }
    }
  };

  // 处理列状态变更
  const handleColumnsOrderChange = React.useCallback(
    (order: string[]) => {
      const current = store.getState();
      store.setState({
        ...current,
        view: {
          ...current.view,
          columnsOrder: order
        }
      });
      saveColumnState({
        columnsOrder: order,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: current.view.columnsPinned
      });
    },
    [store, saveColumnState]
  );

  const handleColumnWidthChange = React.useCallback(
    (columnId: string, width: number) => {
      const current = store.getState();
      const nextWidths = {
        ...(current.view.columnsWidth || {}),
        [columnId]: width
      };
      store.setState({
        ...current,
        view: {
          ...current.view,
          columnsWidth: nextWidths
        }
      });
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: nextWidths,
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: current.view.columnsPinned
      });
    },
    [store, saveColumnState]
  );

  const handleColumnVisibilityChange = React.useCallback(
    (columnId: string, visible: boolean) => {
      const current = store.getState();
      const nextVisibility = {
        ...(current.view.columnsVisibility || {}),
        [columnId]: visible
      };
      store.setState({
        ...current,
        view: {
          ...current.view,
          columnsVisibility: nextVisibility
        }
      });
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: nextVisibility,
        columnsPinned: current.view.columnsPinned
      });
    },
    [store, saveColumnState]
  );

  const handleColumnPinnedChange = React.useCallback(
    (columnId: string, pinned: 'left' | 'right' | undefined) => {
      const current = store.getState();
      const nextPinned = { ...(current.view.columnsPinned || {}) };
      if (pinned) {
        nextPinned[columnId] = pinned;
      } else {
        delete nextPinned[columnId];
      }
      store.setState({
        ...current,
        view: {
          ...current.view,
          columnsPinned: nextPinned
        }
      });
      saveColumnState({
        columnsOrder: current.view.columnsOrder,
        columnsWidth: current.view.columnsWidth,
        columnsVisibility: current.view.columnsVisibility,
        columnsPinned: nextPinned
      });
    },
    [store, saveColumnState]
  );

  const handleReset = React.useCallback(() => {
    const current = store.getState();
    store.setState({
      ...current,
      view: {
        ...current.view,
        columnsOrder: undefined,
        columnsWidth: undefined,
        columnsVisibility: undefined,
        columnsPinned: undefined
      }
    });
    clearColumnState();
  }, [store, clearColumnState]);

  // 列宽自动调整
  const handleColumnResize = React.useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return;

      // 测量表头宽度
      const headerElement = parentRef.current?.querySelector(
        `th[data-column-id="${columnId}"]`
      ) as HTMLElement;
      const headerWidth = headerElement?.offsetWidth || 0;

      // 测量当前可见行的内容宽度
      let maxCellWidth = 0;
      const visibleRows = virtualItems.slice(
        0,
        Math.min(20, virtualItems.length)
      ); // 最多测量20行

      visibleRows.forEach((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return;

        const cell = row
          .getVisibleCells()
          .find((c) => c.column.id === columnId);
        if (!cell) return;

        // 创建临时元素测量文本宽度
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.fontSize = window.getComputedStyle(
          headerElement || document.body
        ).fontSize;
        tempDiv.style.fontFamily = window.getComputedStyle(
          headerElement || document.body
        ).fontFamily;
        tempDiv.textContent = String(cell.getValue() ?? '');
        document.body.appendChild(tempDiv);
        const cellWidth = tempDiv.offsetWidth;
        document.body.removeChild(tempDiv);

        maxCellWidth = Math.max(maxCellWidth, cellWidth);
      });

      // 计算新宽度：max(headerWidth, maxCellWidth) + padding
      const padding = 24; // px-3 (12px) * 2
      const newWidth = Math.max(headerWidth, maxCellWidth) + padding;
      const minWidth = column.minWidth ?? 50;
      const maxWidth = column.maxWidth ?? 1000;
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      handleColumnWidthChange(columnId, finalWidth);
    },
    [columns, virtualItems, rows, handleColumnWidthChange]
  );

  return (
    <div className='mt-grid bg-card rounded-lg border text-sm'>
      <div className='flex items-center justify-between border-b p-2'>
        <div className='flex-1' />
        <button
          onClick={() => setIsColumnPanelOpen(true)}
          className='border-input bg-background hover:bg-accent rounded-md border px-3 py-1.5 text-xs'
          aria-label='列管理'
        >
          列管理
        </button>
      </div>
      <div
        ref={parentRef}
        className='mt-grid-viewport bg-background relative w-full overflow-auto rounded-lg'
        style={{ height: 480 }}
      >
        <table className='mt-grid-table w-full'>
          <thead className='mt-grid-thead bg-muted/40 sticky top-0 z-10 backdrop-blur'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className='mt-grid-tr border-b'>
                {headerGroup.headers.map((header, headerIndex) => {
                  const columnId = header.column.id;
                  const viewState = state.view;
                  const width = viewState.columnsWidth?.[columnId];
                  const pinned = viewState.columnsPinned?.[columnId];

                  // 计算当前列之前的左固定列宽度
                  let leftOffset = 0;
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

                  const stickyStyle: React.CSSProperties = {
                    ...(width
                      ? { width, minWidth: width, maxWidth: width }
                      : {}),
                    ...(pinned === 'left'
                      ? {
                          position: 'sticky',
                          left: leftOffset,
                          top: 0,
                          zIndex: 30, // 高于 thead 的 z-10，确保固定在表头行上方
                          backgroundColor: 'hsl(var(--muted))' // 确保背景色正确，避免内容透过
                        }
                      : pinned === 'right'
                        ? {
                            position: 'sticky',
                            right: rightOffset,
                            top: 0,
                            zIndex: 30, // 高于 thead 的 z-10，确保固定在表头行上方
                            backgroundColor: 'hsl(var(--muted))' // 确保背景色正确，避免内容透过
                          }
                        : {})
                  };

                  return (
                    <th
                      key={header.id}
                      data-column-id={columnId}
                      className={`mt-grid-th text-muted-foreground group relative h-9 px-3 text-left text-xs font-medium ${
                        showHeaderVerticalDividers
                          ? 'border-border border-r'
                          : ''
                      }`}
                      style={stickyStyle}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {/* 列宽调整手柄 */}
                      <div
                        className={
                          showHeaderVerticalDividers
                            ? 'bg-border hover:bg-primary/60 absolute top-0 right-0 h-full w-px cursor-col-resize transition-colors'
                            : 'hover:bg-primary/50 absolute top-0 right-0 h-full w-px cursor-col-resize opacity-0 transition-opacity group-hover:opacity-100'
                        }
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleColumnResize(columnId);
                        }}
                        title='双击自动调整列宽'
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className='mt-grid-tbody' onClick={handleTbodyClick}>
            {paddingTop > 0 && (
              <tr>
                <td
                  colSpan={allVisibleColumns.length}
                  style={{ height: paddingTop }}
                />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className='mt-grid-tr hover:bg-muted/40 border-b transition-colors last:border-b-0'
                  style={{ height: virtualRow.size }}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const columnId = cell.column.id;
                    const meta = cell.column.columnDef.meta as
                      | ColumnMeta<Row>
                      | undefined;
                    const rowKey = row.id;
                    const cellKey = `${rowKey}:${columnId}`;
                    const viewState = state.view;
                    const pinned = viewState.columnsPinned?.[columnId];

                    // 计算当前单元格之前的左固定列宽度
                    let cellLeftOffset = 0;
                    const allCells = row.getVisibleCells();
                    for (let i = 0; i < cellIndex; i++) {
                      const prevCell = allCells[i];
                      if (prevCell) {
                        const prevPinned =
                          viewState.columnsPinned?.[prevCell.column.id];
                        if (prevPinned === 'left') {
                          const prevCol = allVisibleColumns.find(
                            (c) => c.id === prevCell.column.id
                          );
                          const prevWidth =
                            viewState.columnsWidth?.[prevCell.column.id] ??
                            (typeof prevCol?.width === 'number'
                              ? prevCol.width
                              : 150);
                          cellLeftOffset +=
                            typeof prevWidth === 'number' ? prevWidth : 150;
                        }
                      }
                    }

                    // 计算当前单元格之后的右固定列宽度
                    let cellRightOffset = 0;
                    for (let i = cellIndex + 1; i < allCells.length; i++) {
                      const nextCell = allCells[i];
                      if (nextCell) {
                        const nextPinned =
                          viewState.columnsPinned?.[nextCell.column.id];
                        if (nextPinned === 'right') {
                          const nextCol = allVisibleColumns.find(
                            (c) => c.id === nextCell.column.id
                          );
                          const nextWidth =
                            viewState.columnsWidth?.[nextCell.column.id] ??
                            (typeof nextCol?.width === 'number'
                              ? nextCol.width
                              : 150);
                          cellRightOffset +=
                            typeof nextWidth === 'number' ? nextWidth : 150;
                        }
                      }
                    }

                    const cellStickyStyle: React.CSSProperties =
                      pinned === 'left'
                        ? {
                            position: 'sticky',
                            left: cellLeftOffset,
                            zIndex: 20, // 高于普通单元格，但低于表头固定列（z-30）
                            backgroundColor: 'hsl(var(--background))' // 确保背景色正确
                          }
                        : pinned === 'right'
                          ? {
                              position: 'sticky',
                              right: cellRightOffset,
                              zIndex: 20, // 高于普通单元格，但低于表头固定列（z-30）
                              backgroundColor: 'hsl(var(--background))' // 确保背景色正确
                            }
                          : {};

                    const drafts = state.runtime.editingDraftValues;
                    const draftValue =
                      drafts &&
                      Object.prototype.hasOwnProperty.call(drafts, cellKey)
                        ? drafts[cellKey]
                        : undefined;
                    const cellValue = cell.getValue();

                    const isEditing =
                      !!state.runtime.editingCell &&
                      state.runtime.editingCell.rowKey === rowKey &&
                      state.runtime.editingCell.columnId === columnId;

                    // 检查是否有待提交的编辑（用于单行/批量模式）
                    const pendingEdit = state.runtime.pendingEdits.find(
                      (e) => e.rowKey === String(rowKey)
                    );
                    const hasPendingEdit =
                      pendingEdit?.editedRow &&
                      Object.prototype.hasOwnProperty.call(
                        pendingEdit.editedRow,
                        columnId
                      );
                    const pendingValue = hasPendingEdit
                      ? (pendingEdit.editedRow as any)[columnId]
                      : undefined;
                    // 如果有待提交的编辑值，使用它；否则使用原始值或草稿值
                    // 注意：对于数字类型，保持原始值；对于文本类型，使用字符串值
                    const displayValue =
                      hasPendingEdit && !isEditing
                        ? pendingValue
                        : draftValue !== undefined
                          ? draftValue
                          : cellValue;

                    const rawError = state.runtime.validationErrors[cellKey];

                    const columnSchema = columnSchemas[columnId] as {
                      safeParse?: (value: unknown) => {
                        success: boolean;
                        error?: { issues?: Array<{ message: string }> };
                      };
                    };

                    const validateBeforeCommit = (
                      next: unknown
                    ): string | null => {
                      if (!columnSchema?.safeParse) return null;
                      const result = columnSchema.safeParse(next);
                      if (result.success) return null;
                      const firstIssue =
                        (result as any).error?.issues?.[0]?.message ??
                        '无效的值';
                      return firstIssue;
                    };

                    const setError = (msg: string | null) => {
                      const current = store.getState();
                      const nextErrors = {
                        ...current.runtime.validationErrors
                      };
                      if (msg) nextErrors[cellKey] = msg;
                      else delete nextErrors[cellKey];

                      store.setState({
                        ...current,
                        runtime: {
                          ...current.runtime,
                          validationErrors: nextErrors
                        }
                      });
                    };

                    const isNumberLike =
                      meta?.type === 'number' || meta?.type === 'integer';
                    const isBooleanLike =
                      meta?.type === 'boolean' ||
                      meta?.editorType === 'checkbox';
                    const isTextLike =
                      meta?.editorType === 'text' || meta?.type === 'string';

                    if (isNumberLike) {
                      return (
                        <NumberCell
                          key={cell.id}
                          value={displayValue}
                          draftValue={draftValue}
                          meta={meta}
                          isEditing={!!meta?.editable && isEditing}
                          error={isEditing || hasPendingEdit ? rawError : null}
                          isModified={hasPendingEdit}
                          style={cellStickyStyle}
                          onMoveFocus={(direction) => {
                            const target = findNextEditableCellIndex(
                              direction,
                              row.index,
                              cellIndex
                            );
                            if (!target) return;
                            const targetRow = rows[target.rowIndex];
                            const targetColumn =
                              allVisibleColumns[target.columnIndex];
                            const targetCell =
                              targetRow.getVisibleCells()[target.columnIndex];
                            const targetValue = targetCell.getValue();

                            store.dispatch({
                              type: 'edit/start',
                              cell: {
                                rowKey: targetRow.id,
                                columnId: targetColumn.id
                              },
                              initialValue: targetValue
                            });
                          }}
                          onStartEdit={() => {
                            if (!meta?.editable) return;
                            // 如果当前有其他单元格正在编辑，先取消它
                            const current = store.getState();
                            if (
                              current.runtime.editingCell &&
                              (current.runtime.editingCell.rowKey !== rowKey ||
                                current.runtime.editingCell.columnId !==
                                  columnId)
                            ) {
                              store.dispatch({
                                type: 'edit/cancel',
                                cell: {
                                  rowKey: current.runtime.editingCell.rowKey,
                                  columnId: current.runtime.editingCell.columnId
                                }
                              });
                            }
                            store.dispatch({
                              type: 'edit/start',
                              cell: { rowKey, columnId },
                              initialValue: cellValue
                            });
                          }}
                          onChangeDraft={(val) => {
                            // 使用防抖更新草稿值
                            debouncedDispatchChange({ rowKey, columnId }, val);
                            // 使用节流进行验证
                            throttledValidate(
                              () => validateBeforeCommit(val),
                              setError
                            );
                          }}
                          onCommit={(nextNumber) => {
                            const msg = validateBeforeCommit(nextNumber);
                            if (msg) {
                              setError(msg);
                              // 验证失败时，保持编辑状态，不提交
                              return;
                            }
                            setError(null);

                            if (editMode === 'immediate') {
                              // 即时提交模式：立即更新数据
                              const current = store.getState();
                              const nextRows = current.data.rows.map(
                                (r, index) => {
                                  if (index !== row.index) return r;
                                  if (nextNumber == null) return r;
                                  return {
                                    ...(r as any),
                                    [columnId]: nextNumber
                                  };
                                }
                              );
                              store.setState({
                                ...current,
                                data: {
                                  ...current.data,
                                  rows: nextRows
                                }
                              });
                              store.dispatch({
                                type: 'edit/commit',
                                cell: { rowKey, columnId }
                              });
                            } else {
                              // 单行或批量模式：先加入队列，再提交编辑状态
                              store.dispatch({
                                type: 'edit/queue',
                                cell: { rowKey, columnId },
                                value: nextNumber
                              });
                              store.dispatch({
                                type: 'edit/commit',
                                cell: { rowKey, columnId }
                              });
                            }
                          }}
                          onCancel={() =>
                            store.dispatch({
                              type: 'edit/cancel',
                              cell: { rowKey, columnId }
                            })
                          }
                        />
                      );
                    }

                    if (isTextLike) {
                      return (
                        <TextCell
                          key={cell.id}
                          value={displayValue}
                          draftValue={draftValue}
                          meta={meta}
                          isEditing={!!meta?.editable && isEditing}
                          error={isEditing || hasPendingEdit ? rawError : null}
                          isModified={hasPendingEdit}
                          style={cellStickyStyle}
                          onStartEdit={() => {
                            if (!meta?.editable) return;
                            // 如果当前有其他单元格正在编辑，先取消它
                            const current = store.getState();
                            if (
                              current.runtime.editingCell &&
                              (current.runtime.editingCell.rowKey !== rowKey ||
                                current.runtime.editingCell.columnId !==
                                  columnId)
                            ) {
                              store.dispatch({
                                type: 'edit/cancel',
                                cell: {
                                  rowKey: current.runtime.editingCell.rowKey,
                                  columnId: current.runtime.editingCell.columnId
                                }
                              });
                            }
                            store.dispatch({
                              type: 'edit/start',
                              cell: { rowKey, columnId },
                              initialValue: cellValue ?? ''
                            });
                          }}
                          onChangeDraft={(val) => {
                            // 使用防抖更新草稿值
                            debouncedDispatchChange({ rowKey, columnId }, val);
                            // 使用节流进行验证
                            throttledValidate(
                              () => validateBeforeCommit(val),
                              setError
                            );
                          }}
                          onCommit={(nextText) => {
                            const msg = validateBeforeCommit(nextText);
                            if (msg) {
                              setError(msg);
                              // 验证失败时，保持编辑状态，不提交
                              return;
                            }
                            setError(null);

                            if (editMode === 'immediate') {
                              // 即时提交模式：立即更新数据
                              const current = store.getState();
                              const nextRows = current.data.rows.map(
                                (r, index) => {
                                  if (index !== row.index) return r;
                                  return {
                                    ...(r as any),
                                    [columnId]: nextText
                                  };
                                }
                              );
                              store.setState({
                                ...current,
                                data: {
                                  ...current.data,
                                  rows: nextRows
                                }
                              });
                              store.dispatch({
                                type: 'edit/commit',
                                cell: { rowKey, columnId }
                              });
                            } else {
                              // 单行或批量模式：先加入队列，再提交编辑状态
                              store.dispatch({
                                type: 'edit/queue',
                                cell: { rowKey, columnId },
                                value: nextText
                              });
                              store.dispatch({
                                type: 'edit/commit',
                                cell: { rowKey, columnId }
                              });
                            }
                          }}
                          onCancel={() =>
                            store.dispatch({
                              type: 'edit/cancel',
                              cell: { rowKey, columnId }
                            })
                          }
                          onMoveFocus={(direction) => {
                            const target = findNextEditableCellIndex(
                              direction,
                              row.index,
                              cellIndex
                            );
                            if (!target) return;
                            const targetRow = rows[target.rowIndex];
                            const targetColumn =
                              allVisibleColumns[target.columnIndex];
                            const targetCell =
                              targetRow.getVisibleCells()[target.columnIndex];
                            const targetValue = targetCell.getValue() ?? '';

                            store.dispatch({
                              type: 'edit/start',
                              cell: {
                                rowKey: targetRow.id,
                                columnId: targetColumn.id
                              },
                              initialValue: targetValue
                            });
                          }}
                        />
                      );
                    }

                    if (isBooleanLike) {
                      // 检查是否有待提交的编辑（用于单行/批量模式）
                      const pendingEditForCheckbox =
                        state.runtime.pendingEdits.find(
                          (e) => e.rowKey === String(rowKey)
                        );
                      const hasPendingEditForCheckbox =
                        pendingEditForCheckbox?.editedRow &&
                        Object.prototype.hasOwnProperty.call(
                          pendingEditForCheckbox.editedRow,
                          columnId
                        );
                      const pendingValueForCheckbox = hasPendingEditForCheckbox
                        ? (pendingEditForCheckbox.editedRow as any)[columnId]
                        : undefined;
                      const displayValueForCheckbox =
                        hasPendingEditForCheckbox && !isEditing
                          ? pendingValueForCheckbox
                          : cellValue;

                      return (
                        <CheckboxCell
                          key={cell.id}
                          value={displayValueForCheckbox}
                          meta={meta}
                          error={
                            isEditing || hasPendingEditForCheckbox
                              ? rawError
                              : null
                          }
                          isModified={hasPendingEditForCheckbox}
                          style={cellStickyStyle}
                          onToggle={(nextBool) => {
                            const rawValue =
                              meta && (meta as any).trueValue !== undefined
                                ? nextBool
                                  ? (meta as any).trueValue
                                  : (meta as any).falseValue
                                : nextBool;

                            const msg = validateBeforeCommit(rawValue);
                            if (msg) {
                              setError(msg);
                              return;
                            }
                            setError(null);

                            if (editMode === 'immediate') {
                              // 即时提交模式：立即更新数据
                              const current = store.getState();
                              const nextRows = current.data.rows.map(
                                (r, index) => {
                                  if (index !== row.index) return r;
                                  return {
                                    ...(r as any),
                                    [columnId]: rawValue
                                  };
                                }
                              );
                              store.setState({
                                ...current,
                                data: {
                                  ...current.data,
                                  rows: nextRows
                                }
                              });
                            } else {
                              // 单行或批量模式：加入队列
                              store.dispatch({
                                type: 'edit/queue',
                                cell: { rowKey, columnId },
                                value: rawValue
                              });
                            }
                          }}
                        />
                      );
                    }

                    return (
                      <td
                        key={cell.id}
                        className={`mt-grid-td px-3 py-2 align-middle whitespace-nowrap ${
                          rawError ? 'text-destructive' : ''
                        }`}
                        style={cellStickyStyle}
                        title={rawError || undefined}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        ) ?? String(cellValue ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td
                  colSpan={allVisibleColumns.length}
                  style={{ height: paddingBottom }}
                />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editMode !== 'immediate' && onSubmit && (
        <div className='mt-4 px-4 pb-4'>
          <SubmissionControls
            store={store}
            columns={columns}
            onSubmit={onSubmit}
            onValidationError={onValidationError}
            onSubmissionError={onSubmissionError}
          />
        </div>
      )}

      <ColumnManagementPanel
        columns={columns}
        columnsOrder={state.view.columnsOrder}
        columnsWidth={state.view.columnsWidth}
        columnsVisibility={state.view.columnsVisibility}
        columnsPinned={state.view.columnsPinned}
        onColumnsOrderChange={handleColumnsOrderChange}
        onColumnWidthChange={handleColumnWidthChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onColumnPinnedChange={handleColumnPinnedChange}
        onReset={handleReset}
        open={isColumnPanelOpen}
        onOpenChange={setIsColumnPanelOpen}
      />
    </div>
  );
}
