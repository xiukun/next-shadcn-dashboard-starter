'use client';

import * as React from 'react';
import type {
  ColumnConfig,
  DataSource,
  ColumnMeta,
  RowKey
} from '@maita-table/core';
import type { DataGridViewState } from '@maita-table/core';
import { createColumnSchema } from '@maita-table/core';
import { useDataGrid } from './useDataGrid';
import { useTableColumns } from './hooks/useTableColumns';
import { useTableInstance } from './hooks/useTableInstance';
import { useTableVirtualization } from './hooks/useTableVirtualization';
import { useTableEvents } from './hooks/useTableEvents';
import { useTablePagination } from './hooks/useTablePagination';
import { useRowSelection, type SelectionMode } from './hooks/useRowSelection';
import { useDataGridSelection } from './hooks/useDataGridSelection';
import { useSelectionPersistence } from './hooks/useSelectionPersistence';
import { usePaginationPersistence } from './hooks/usePaginationPersistence';
import { useColumnSorting } from './hooks/useColumnSorting';
import { useColumnFiltering } from './hooks/useColumnFiltering';
import { useColumnPersistence } from './hooks/useColumnPersistence';
import { useColumnStateHandlers } from './hooks/useColumnStateHandlers';
import { SubmissionControls } from './components/SubmissionControls';
import { ColumnManagementPanel } from './components/ColumnManagementPanel';
import { DataGridHeader } from './components/DataGridHeader';
import { DataGridBody } from './components/DataGridBody';
import { DataGridPagination } from './components/DataGridPagination';
import { ColumnMenu, type ColumnMenuLabels } from './components/ColumnMenu';

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
  /**
   * 是否启用分页（默认 false）
   */
  enablePagination?: boolean;
  /**
   * 分页模式：'client' 客户端分页，'server' 服务端分页（默认 'client'）
   */
  paginationMode?: 'client' | 'server';
  /**
   * 初始页码（从 0 开始，默认 0）
   */
  initialPageIndex?: number;
  /**
   * 初始每页条数（默认 10）
   */
  initialPageSize?: number;
  /**
   * 每页条数选项（默认 [10, 20, 50, 100]）
   */
  pageSizeOptions?: number[];
  /**
   * 总行数（服务端分页时必需）
   */
  rowCount?: number;
  /**
   * 总页数（服务端分页时可选，如果提供则优先使用）
   */
  pageCount?: number;
  /**
   * 是否启用分页状态持久化（默认 false）
   */
  enablePaginationPersistence?: boolean;
  /**
   * 分页状态变更回调
   */
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
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
    columnMenuLabels,
    enablePagination = false,
    paginationMode = 'client',
    initialPageIndex = 0,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    rowCount,
    pageCount,
    enablePaginationPersistence = false,
    onPaginationChange
  } = props;

  const { state, store } = useDataGrid<Row>({
    ...props,
    initialPagination: {
      pageIndex: initialPageIndex,
      pageSize: initialPageSize
    }
  });

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

  // 分页状态持久化
  usePaginationPersistence({
    gridId: id,
    enabled: enablePagination && enablePaginationPersistence,
    store
  });

  // 列排序功能
  const sorting = useColumnSorting({
    store,
    enableMultiSort: true
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

  // 使用新的 hooks
  const { visibleColumns, columnDefs, leftPinnedWidth, rightPinnedWidth } =
    useTableColumns({
      columns,
      store
    });

  const table = useTableInstance({
    store,
    columns: columnDefs,
    enablePagination,
    paginationMode,
    rowCount,
    pageCount
  });

  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const {
    rowVirtualizer,
    virtualItems,
    paddingTop,
    paddingBottom,
    scrollLeft,
    containerWidth
  } = useTableVirtualization({
    store,
    estimateRowHeight,
    scrollElementRef: scrollContainerRef
  });

  const events = useTableEvents({
    store
  });

  // 列状态处理 handlers（带持久化）
  const columnHandlers = useColumnStateHandlers({
    store,
    columns,
    events,
    saveColumnState,
    clearColumnState
  });

  const pagination = useTablePagination({
    store,
    enablePagination,
    paginationMode
  });

  // 分页变化时清空行勾选状态（按页选择语义）
  React.useEffect(() => {
    selection.deselectAll();
    // 这里只关心分页参数变化，不将 selection 放入依赖，避免因其引用每次变更导致无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.pageIndex, state.pagination.pageSize]);

  // 列宽自动调整
  const handleColumnResize = React.useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return;

      // 测量表头宽度
      const headerElement = document.querySelector(
        `th[data-column-id="${columnId}"]`
      ) as HTMLElement;
      const headerWidth = headerElement?.offsetWidth || 0;

      // 测量当前可见行的内容宽度
      let maxCellWidth = 0;
      const visibleRows = virtualItems.slice(
        0,
        Math.min(20, virtualItems.length)
      );

      visibleRows.forEach((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index];
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

      // 计算新宽度
      const padding = 24;
      const newWidth = Math.max(headerWidth, maxCellWidth) + padding;
      const minWidth = column.minWidth ?? 50;
      const maxWidth = column.maxWidth ?? 1000;
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      columnHandlers.handleColumnWidthChange(columnId, finalWidth);
    },
    [columns, virtualItems, table, columnHandlers]
  );

  // 当前可见行
  const rows = table.getRowModel().rows;

  // 获取当前页所有行的 key（用于全选）
  const currentPageRowKeys = React.useMemo(() => {
    return rows.map((row) => row.id as RowKey);
  }, [rows]);

  // 使用提取的勾选逻辑 hook
  const { handleRowToggle, handleToggleAll } = useDataGridSelection({
    enableRowSelection,
    selection,
    currentPageRowKeys
  });

  // 处理 tbody 点击
  const handleTbodyClick = React.useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      if (e.target === e.currentTarget) {
        const current = store.getState();
        if (current.runtime.editingCell) {
          current.cancelEditing(current.runtime.editingCell);
        }
      }
    },
    [store]
  );

  // 查找下一个可编辑单元格
  const findNextEditableCellIndex = React.useCallback(
    (
      direction: 'next' | 'prev',
      rowIndex: number,
      columnIndex: number
    ): { rowIndex: number; columnIndex: number } | null => {
      const rows = table.getRowModel().rows;
      const rowCount = rows.length;
      const colCount = visibleColumns.all.length;

      let r = rowIndex;
      let c = columnIndex;

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

        const nextColumn = visibleColumns.all[c];
        const meta = nextColumn.meta as ColumnMeta<Row> | undefined;
        if (meta?.editable) {
          return { rowIndex: r, columnIndex: c };
        }
      }

      return null;
    },
    [table, visibleColumns.all]
  );

  // 列 schema（用于验证）
  const columnSchemas = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    columns.forEach((col) => {
      map[col.id] = createColumnSchema(col, col.meta);
    });
    return map;
  }, [columns]);

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
        ref={scrollContainerRef}
        className='mt-grid-viewport bg-background relative w-full overflow-auto rounded-lg'
        style={{ height: 480 }}
      >
        <table className='mt-grid-table w-full'>
          <DataGridHeader
            headerGroups={table.getHeaderGroups()}
            allVisibleColumns={visibleColumns.all}
            store={store}
            enableRowSelection={enableRowSelection}
            currentPageRowKeys={currentPageRowKeys}
            selection={selection}
            sorting={sorting}
            filtering={filtering}
            onToggleAll={handleToggleAll}
            onColumnResize={handleColumnResize}
            onColumnPinnedChange={columnHandlers.handleColumnPinnedChange}
            showHeaderVerticalDividers={showHeaderVerticalDividers}
            CheckboxComponent={CheckboxComponent}
            columnMenuLabels={columnMenuLabels}
            filterMenuOpenMap={filterMenuOpenMap}
            setFilterMenuOpenMap={setFilterMenuOpenMap}
            columnMenuOpenMap={columnMenuOpenMap}
            setColumnMenuOpenMap={setColumnMenuOpenMap}
            columnMenuButtonRefs={columnMenuButtonRefs}
            filterButtonRefs={filterButtonRefs}
          />
          <DataGridBody
            rows={rows}
            virtualItems={virtualItems}
            paddingTop={paddingTop}
            paddingBottom={paddingBottom}
            allVisibleColumns={visibleColumns.all}
            store={store}
            columnSchemas={columnSchemas}
            editMode={editMode}
            enableRowSelection={enableRowSelection}
            selection={selection}
            onRowToggle={handleRowToggle}
            CheckboxComponent={CheckboxComponent}
            findNextEditableCellIndex={findNextEditableCellIndex}
            onTbodyClick={handleTbodyClick}
          />
        </table>
      </div>
      {enablePagination && (
        <DataGridPagination
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          showRowCount={true}
        />
      )}
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
        onColumnsOrderChange={columnHandlers.handleColumnsOrderChange}
        onColumnWidthChange={columnHandlers.handleColumnWidthChange}
        onColumnVisibilityChange={columnHandlers.handleColumnVisibilityChange}
        onColumnPinnedChange={columnHandlers.handleColumnPinnedChange}
        onReset={columnHandlers.handleReset}
        open={isColumnPanelOpen}
        onOpenChange={setIsColumnPanelOpen}
      />
    </div>
  );
}
