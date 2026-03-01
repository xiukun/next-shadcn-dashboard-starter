'use client';

import * as React from 'react';
import type { ColumnConfig, DataSource, ColumnMeta } from '@maita-table/core';
import type { DataGridViewState } from '@maita-table/core';
import { createColumnSchema } from '@maita-table/core';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import {
  SelectionCheckbox,
  HeaderSelectionCheckbox
} from './components/SelectionCheckbox';
import { useDebouncedCallback } from './hooks/useDebounce';
import { useThrottledCallback } from './hooks/useThrottle';
import { useColumnPersistence } from './hooks/useColumnPersistence';
import { useColumnVirtualization } from './hooks/useColumnVirtualization';
import { useRowSelection, type SelectionMode } from './hooks/useRowSelection';
import { useSelectionPersistence } from './hooks/useSelectionPersistence';
import { useColumnSorting } from './hooks/useColumnSorting';
import { useColumnFiltering } from './hooks/useColumnFiltering';
import { ColumnHeader } from './components/ColumnHeader';
import { FloatingFilter } from './components/FloatingFilter';
import { FilterPopover } from './components/FilterPopover';
import { ColumnMenu, type ColumnMenuLabels } from './components/ColumnMenu';
import type { RowKey } from '@maita-table/core';

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
  /**
   * 是否启用行选择功能（默认 true）
   */
  enableRowSelection?: boolean;
  /**
   * 选择模式：'single' 单选，'multiple' 多选（默认）
   */
  selectionMode?: SelectionMode;
  /**
   * 受控模式：外部控制的选择状态
   */
  selectedRowKeys?: RowKey[];
  /**
   * 选择状态变更回调
   */
  onSelectionChange?: (selectedRowKeys: RowKey[]) => void;
  /**
   * 是否启用选择状态持久化（默认 true）
   */
  enableSelectionPersistence?: boolean;
  /**
   * 自定义 Checkbox 组件（可选，用于使用 shadcn/ui 的 Checkbox）
   */
  CheckboxComponent?: React.ComponentType<{
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    'aria-checked'?: boolean | 'mixed';
  }>;
  /**
   * 列菜单标签文本（用于 i18n）
   */
  columnMenuLabels?: ColumnMenuLabels;
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
    showHeaderVerticalDividers = false,
    enableRowSelection = true,
    selectionMode = 'multiple',
    selectedRowKeys: controlledSelectedRowKeys,
    onSelectionChange,
    enableSelectionPersistence = true,
    CheckboxComponent,
    columnMenuLabels
  } = props;
  const { state, store } = useDataGrid<Row>(props);

  const [isColumnPanelOpen, setIsColumnPanelOpen] = React.useState(false);
  const { saveColumnState, clearColumnState } = useColumnPersistence({
    gridId: id
  });

  // 行选择功能
  const selection = useRowSelection({
    store,
    selectionMode: enableRowSelection ? selectionMode : 'multiple',
    selectedRowKeys: controlledSelectedRowKeys,
    onSelectionChange
  });

  // 选择状态持久化
  useSelectionPersistence({
    gridId: id,
    enabled: enableRowSelection && enableSelectionPersistence,
    store
  });

  // 列排序功能
  const sorting = useColumnSorting({
    store,
    enableMultiSort: true // 支持多列排序
  });

  // 列过滤功能
  const filtering = useColumnFiltering({
    store
  });

  // 过滤菜单打开状态（按列 ID 存储）
  const [filterMenuOpenMap, setFilterMenuOpenMap] = React.useState<
    Record<string, boolean>
  >({});

  // 列菜单打开状态（按列 ID 存储）
  const [columnMenuOpenMap, setColumnMenuOpenMap] = React.useState<
    Record<string, boolean>
  >({});

  // 列菜单按钮 ref 映射（按列 ID 存储）
  const columnMenuButtonRefs = React.useRef<
    Map<string, React.RefObject<HTMLButtonElement | null>>
  >(new Map());

  // 过滤按钮 ref 映射（按列 ID 存储）
  const filterButtonRefs = React.useRef<
    Map<string, React.RefObject<HTMLButtonElement | null>>
  >(new Map());

  // 记录上次选中的行（用于范围选择）
  const lastSelectedRowKeyRef = React.useRef<RowKey | null>(null);

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

  // 将排序状态转换为 TanStack Table 格式
  const tanStackSorting = React.useMemo(() => {
    return (
      state.view.sort?.map((s) => ({
        id: s.id,
        desc: s.desc
      })) || []
    );
  }, [state.view.sort]);

  // 将过滤状态转换为 TanStack Table 格式
  const tanStackColumnFilters = React.useMemo(() => {
    return (
      state.view.filters?.map((f) => ({
        id: f.id,
        value: f.value
      })) || []
    );
  }, [state.view.filters]);

  const table = useReactTable({
    data: state.data.rows,
    columns: columnDefs,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: tanStackSorting,
      columnFilters: tanStackColumnFilters
    },
    onSortingChange: () => {
      // 排序状态通过 useColumnSorting hook 管理
      // TanStack Table 的排序主要用于前端计算和 UI 反馈
    },
    onColumnFiltersChange: () => {
      // 过滤状态通过 useColumnFiltering hook 管理
      // TanStack Table 的过滤主要用于前端计算和 UI 反馈
    },
    manualSorting: true, // 使用服务端排序，但允许前端计算用于 UI 反馈
    manualFiltering: true // 使用服务端过滤，但允许前端计算用于 UI 反馈
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

  // 获取当前页所有行的 key（用于全选）
  const currentPageRowKeys = React.useMemo(() => {
    return rows.map((row) => row.id as RowKey);
  }, [rows]);

  // 处理行选择（支持 Shift+Click 范围选择）
  const handleRowToggle = React.useCallback(
    (rowKey: RowKey, event?: React.MouseEvent) => {
      if (!enableRowSelection) return;

      const isShiftClick = event?.shiftKey ?? false;

      if (isShiftClick && lastSelectedRowKeyRef.current !== null) {
        // 范围选择
        selection.selectRange(
          lastSelectedRowKeyRef.current,
          rowKey,
          currentPageRowKeys
        );
      } else {
        // 普通选择
        selection.toggleRow(rowKey);
        lastSelectedRowKeyRef.current = rowKey;
      }
    },
    [enableRowSelection, selection, currentPageRowKeys]
  );

  // 处理全选
  const handleToggleAll = React.useCallback(() => {
    if (!enableRowSelection) return;

    const totalCount = currentPageRowKeys.length;
    if (totalCount === 0) return;

    const selectedOnPage =
      selection.getSelectedCountForKeys(currentPageRowKeys);

    if (selectedOnPage === totalCount) {
      // 当前页已全部选中 → 一次性取消当前页所有选择
      selection.deselectKeys(currentPageRowKeys);
    } else {
      // 当前页未全部选中 → 一次性选中当前页所有行
      selection.selectKeys(currentPageRowKeys);
    }
  }, [enableRowSelection, selection, currentPageRowKeys]);

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
              <React.Fragment key={headerGroup.id}>
                <tr className='mt-grid-tr border-b'>
                  {/* 选择列的表头 checkbox */}
                  {enableRowSelection && (
                    <HeaderSelectionCheckbox
                      allRowKeys={currentPageRowKeys}
                      selection={selection}
                      onToggleAll={handleToggleAll}
                      CheckboxComponent={CheckboxComponent}
                    />
                  )}
                  {headerGroup.headers.map((header, headerIndex) => {
                    const columnId = header.column.id;
                    const viewState = state.view;
                    const width = viewState.columnsWidth?.[columnId];
                    const pinned = viewState.columnsPinned?.[columnId];
                    const column = allVisibleColumns.find(
                      (c) => c.id === columnId
                    );

                    // 计算当前列之前的左固定列宽度
                    // 如果启用了行选择，选择列（48px）是最左侧的固定列
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
                    const enableFloatingFilter =
                      meta?.enableFloatingFilter ?? false;
                    const filterType =
                      (meta?.filterType as 'text' | 'number' | 'date') ||
                      'text';
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

                    // 菜单按钮的 ref（用于 Popover 定位）
                    if (!columnMenuButtonRefs.current.has(columnId)) {
                      columnMenuButtonRefs.current.set(
                        columnId,
                        React.createRef<HTMLButtonElement>()
                      );
                    }
                    const menuButtonRef =
                      columnMenuButtonRefs.current.get(columnId)!;

                    // 过滤按钮的 ref（用于 Popover 定位）
                    if (!filterButtonRefs.current.has(columnId)) {
                      filterButtonRefs.current.set(
                        columnId,
                        React.createRef<HTMLButtonElement>()
                      );
                    }
                    const filterButtonRef =
                      filterButtonRefs.current.get(columnId)!;

                    // 处理浮动过滤器值变化（使用防抖）
                    const handleFloatingFilterChange = (value: string) => {
                      let operator: 'contains' | 'gt' | 'lt' | 'eq' =
                        'contains';
                      if (filterType === 'number') {
                        operator = 'gt'; // 默认大于，可以根据需要调整
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
                        onSortIndicatorClick={(e) =>
                          sorting.toggleSort(columnId, e)
                        }
                        hasFilter={hasFilter}
                        onFilterClick={() => {
                          setFilterMenuOpen(true);
                        }}
                        onMenuClick={() => {
                          setColumnMenuOpen(true);
                        }}
                        onColumnResize={handleColumnResize}
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
                      const column = allVisibleColumns.find(
                        (c) => c.id === columnId
                      );
                      if (!column) return <td key={header.id} />;
                      const meta = column.meta;
                      const enableFloatingFilter =
                        meta?.enableFloatingFilter ?? false;
                      const filterType =
                        (meta?.filterType as 'text' | 'number' | 'date') ||
                        'text';

                      // 处理浮动过滤器值变化（使用防抖）
                      const handleFloatingFilterChange = (value: string) => {
                        let operator: 'contains' | 'gt' | 'lt' | 'eq' =
                          'contains';
                        if (filterType === 'number') {
                          operator = 'gt';
                        } else if (filterType === 'date') {
                          operator = 'eq';
                        }
                        filtering.setFilter(columnId, operator, value);
                      };

                      const viewState = state.view;
                      const width = viewState.columnsWidth?.[columnId];
                      const pinned = viewState.columnsPinned?.[columnId];

                      // 计算固定列偏移量（与表头一致）
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
                        ...(width
                          ? { width, minWidth: width, maxWidth: width }
                          : {}),
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
                            (meta?.enableFiltering ??
                              column.enableFiltering) && (
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
                {/* 过滤菜单 Popover（放在表头外，通过 Portal 渲染） */}
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const column = allVisibleColumns.find(
                    (c) => c.id === columnId
                  );
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

                  const columnMenuOpen = columnMenuOpenMap[columnId] || false;
                  const setColumnMenuOpen = (open: boolean) => {
                    setColumnMenuOpenMap((prev) => ({
                      ...prev,
                      [columnId]: open
                    }));
                  };

                  // 获取过滤按钮的 ref
                  const filterButtonRef =
                    filterButtonRefs.current.get(columnId);

                  return (meta?.enableFiltering ?? column.enableFiltering) ? (
                    <FilterPopover
                      key={`filter-${columnId}`}
                      columnId={columnId}
                      filterType={filterType}
                      filtering={filtering}
                      open={filterMenuOpen}
                      onOpenChange={setFilterMenuOpen}
                      triggerRef={
                        filterButtonRef as React.RefObject<HTMLElement>
                      }
                    />
                  ) : null;
                })}
                {/* 列菜单 Popover（放在表头外，通过 Portal 渲染） */}
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const column = allVisibleColumns.find(
                    (c) => c.id === columnId
                  );
                  if (!column) return null;
                  const viewState = state.view;
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

                  const menuButtonRef =
                    columnMenuButtonRefs.current.get(columnId);

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
                      onPinColumn={handleColumnPinnedChange}
                      onAutoResize={handleColumnResize}
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
          <tbody
            className='mt-grid-tbody'
            onClick={handleTbodyClick}
            style={{ position: 'relative', zIndex: 0 }}
          >
            {paddingTop > 0 && (
              <tr>
                <td
                  colSpan={
                    allVisibleColumns.length + (enableRowSelection ? 1 : 0)
                  }
                  style={{ height: paddingTop }}
                />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const rowKey = row.id as RowKey;
              const isRowSelected =
                enableRowSelection && selection.isSelected(rowKey);

              return (
                <tr
                  key={row.id}
                  className={`mt-grid-tr border-b transition-colors last:border-b-0 ${
                    isRowSelected
                      ? 'bg-primary/10 hover:bg-primary/20'
                      : 'hover:bg-muted/40'
                  }`}
                  style={{ height: virtualRow.size }}
                >
                  {/* 选择列的行 checkbox */}
                  {enableRowSelection && (
                    <SelectionCheckbox
                      rowKey={rowKey}
                      isSelected={isRowSelected}
                      selection={selection}
                      onToggle={() => handleRowToggle(rowKey)}
                      CheckboxComponent={CheckboxComponent}
                    />
                  )}
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
                    // 如果启用了行选择，选择列（48px）是最左侧的固定列
                    let cellLeftOffset = enableRowSelection ? 48 : 0;
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

                    // 确保固定列始终有背景色，完全遮挡底层内容
                    // 选中状态：使用 primary/10，未选中状态：使用 background
                    // 使用 color-mix 来混合颜色，确保背景色不透明
                    const fixedCellBackgroundColor = isRowSelected
                      ? 'color-mix(in oklch, var(--primary) 10%, var(--background))' // 选中行：使用 primary 颜色的浅色背景
                      : 'var(--background)'; // 未选中行：使用默认背景，确保不透明

                    const cellStickyStyle: React.CSSProperties =
                      pinned === 'left'
                        ? {
                            position: 'sticky',
                            left: cellLeftOffset,
                            zIndex: 20, // 高于普通单元格（z-0），但低于表头固定列（z-40）和选择列（z-30）
                            // 确保背景色始终存在且不透明，完全遮挡底层内容
                            backgroundColor: fixedCellBackgroundColor,
                            // 添加右侧阴影，视觉上区分固定列和非固定列
                            boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)',
                            // 确保背景色在 hover 时也能正确显示
                            transition: 'background-color 0.15s ease-in-out'
                          }
                        : pinned === 'right'
                          ? {
                              position: 'sticky',
                              right: cellRightOffset,
                              zIndex: 20, // 高于普通单元格（z-0），但低于表头固定列（z-40）
                              // 确保背景色始终存在且不透明，完全遮挡底层内容
                              backgroundColor: fixedCellBackgroundColor,
                              // 添加左侧阴影，视觉上区分固定列和非固定列
                              boxShadow: '-2px 0 4px -2px rgba(0, 0, 0, 0.1)',
                              // 确保背景色在 hover 时也能正确显示
                              transition: 'background-color 0.15s ease-in-out'
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
                        onMouseEnter={
                          pinned
                            ? (e) => {
                                // hover 时，如果未选中，使用 muted/40；如果已选中，使用 primary/20
                                const hoverBg = isRowSelected
                                  ? 'color-mix(in oklch, var(--primary) 20%, var(--background))'
                                  : 'color-mix(in oklch, var(--muted) 40%, var(--background))';
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = hoverBg;
                              }
                            : undefined
                        }
                        onMouseLeave={
                          pinned
                            ? (e) => {
                                // 离开时恢复原始背景色
                                const originalBg = isRowSelected
                                  ? 'color-mix(in oklch, var(--primary) 10%, var(--background))'
                                  : 'var(--background)';
                                (
                                  e.currentTarget as HTMLElement
                                ).style.backgroundColor = originalBg;
                              }
                            : undefined
                        }
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
