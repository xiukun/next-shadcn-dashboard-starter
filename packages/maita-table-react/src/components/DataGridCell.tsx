'use client';

import * as React from 'react';
import { flexRender } from '@tanstack/react-table';
import type { Cell, Row as TanStackRow } from '@tanstack/react-table';
import type { ColumnConfig, ColumnMeta, RowKey } from '@maita-table/core';
import { createColumnSchema } from '@maita-table/core';
import { NumberCell } from '../cells/number-cell';
import { TextCell } from '../cells/text-cell';
import { CheckboxCell } from '../cells/checkbox-cell';
import type { DataGridStore } from '../store';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useThrottledCallback } from '../hooks/useThrottle';
import type { EditMode } from '../DataGrid';

export interface DataGridCellProps<TRow> {
  cell: Cell<TRow, unknown>;
  row: TanStackRow<TRow>;
  cellIndex: number;
  column: ColumnConfig<TRow>;
  allVisibleColumns: ColumnConfig<TRow>[];
  rows: TanStackRow<TRow>[];
  store: DataGridStore<TRow>;
  columnSchemas: Record<string, unknown>;
  editMode: EditMode;
  isRowSelected: boolean;
  enableRowSelection: boolean;
  findNextEditableCellIndex: (
    direction: 'next' | 'prev',
    rowIndex: number,
    columnIndex: number
  ) => { rowIndex: number; columnIndex: number } | null;
}

export function DataGridCell<TRow>(props: DataGridCellProps<TRow>) {
  const {
    cell,
    row,
    cellIndex,
    column,
    allVisibleColumns,
    rows,
    store,
    columnSchemas,
    editMode,
    isRowSelected,
    enableRowSelection,
    findNextEditableCellIndex
  } = props;

  const columnId = cell.column.id;
  const meta = cell.column.columnDef.meta as ColumnMeta<TRow> | undefined;
  const rowKey = row.id;
  const cellKey = `${rowKey}:${columnId}`;

  const state = store.getState();
  const viewState = state.view;
  const pinned = viewState.columnsPinned?.[columnId];
  const width = viewState.columnsWidth?.[columnId];

  // 计算当前单元格之前的左固定列宽度
  let cellLeftOffset = enableRowSelection ? 48 : 0;
  const allCells = row.getVisibleCells();
  for (let i = 0; i < cellIndex; i++) {
    const prevCell = allCells[i];
    if (prevCell) {
      const prevPinned = viewState.columnsPinned?.[prevCell.column.id];
      if (prevPinned === 'left') {
        const prevCol = allVisibleColumns.find(
          (c) => c.id === prevCell.column.id
        );
        const prevWidth =
          viewState.columnsWidth?.[prevCell.column.id] ??
          (typeof prevCol?.width === 'number' ? prevCol.width : 150);
        cellLeftOffset += typeof prevWidth === 'number' ? prevWidth : 150;
      }
    }
  }

  // 计算当前单元格之后的右固定列宽度
  let cellRightOffset = 0;
  for (let i = cellIndex + 1; i < allCells.length; i++) {
    const nextCell = allCells[i];
    if (nextCell) {
      const nextPinned = viewState.columnsPinned?.[nextCell.column.id];
      if (nextPinned === 'right') {
        const nextCol = allVisibleColumns.find(
          (c) => c.id === nextCell.column.id
        );
        const nextWidth =
          viewState.columnsWidth?.[nextCell.column.id] ??
          (typeof nextCol?.width === 'number' ? nextCol.width : 150);
        cellRightOffset += typeof nextWidth === 'number' ? nextWidth : 150;
      }
    }
  }

  // 确保固定列始终有背景色
  const fixedCellBackgroundColor = isRowSelected
    ? 'color-mix(in oklch, var(--primary) 10%, var(--background))'
    : 'var(--background)';

  // 获取列的实际宽度（用于固定列宽度设置）
  // 对于固定列，需要设置宽度以确保与表头对齐
  // 优先使用手动调整的宽度，其次使用列配置的宽度，最后使用默认宽度150px
  const columnWidth =
    width ?? (typeof column.width === 'number' ? column.width : 150);
  const cellStickyStyle: React.CSSProperties =
    pinned === 'left'
      ? {
          width: columnWidth,
          minWidth: columnWidth,
          maxWidth: columnWidth,
          position: 'sticky',
          left: cellLeftOffset,
          zIndex: 20,
          backgroundColor: fixedCellBackgroundColor,
          boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.15s ease-in-out'
        }
      : pinned === 'right'
        ? {
            width: columnWidth,
            minWidth: columnWidth,
            maxWidth: columnWidth,
            position: 'sticky',
            right: cellRightOffset,
            zIndex: 20,
            backgroundColor: fixedCellBackgroundColor,
            boxShadow: '-2px 0 4px -2px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.15s ease-in-out'
          }
        : {};

  // === 分组相关状态 ===
  const isGroupedRow =
    typeof row.getIsGrouped === 'function' && row.getIsGrouped();
  const isPlaceholderCell =
    typeof cell.getIsPlaceholder === 'function' && cell.getIsPlaceholder();
  const isAggregatedCell =
    typeof cell.getIsAggregated === 'function' && cell.getIsAggregated();

  // 占位单元格（用于对齐分组行）
  if (isPlaceholderCell) {
    return <td key={cell.id} className='mt-grid-td' style={cellStickyStyle} />;
  }

  // 分组头单元格：展示分组值 + 子行数量，并提供展开/收起交互
  if (
    isGroupedRow &&
    typeof cell.getIsGrouped === 'function' &&
    cell.getIsGrouped()
  ) {
    const subRowCount = row.subRows?.length ?? 0;

    return (
      <td
        key={cell.id}
        className='mt-grid-td bg-muted/60 text-sm font-medium'
        style={{
          ...cellStickyStyle,
          // 根据分组层级缩进
          paddingLeft: 12 + (row.depth || 0) * 16
        }}
      >
        <button
          type='button'
          onClick={row.getToggleExpandedHandler()}
          className='mr-2 inline-flex h-5 w-5 items-center justify-center rounded border text-[10px]'
          aria-label={row.getIsExpanded() ? '折叠分组' : '展开分组'}
        >
          {row.getIsExpanded() ? '-' : '+'}
        </button>
        <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
        <span className='text-muted-foreground ml-2 text-xs'>
          ({subRowCount})
        </span>
      </td>
    );
  }

  // 聚合单元格：用于展示分组后的汇总值（支持按列元数据开关与格式化）
  if (isAggregatedCell) {
    const aggregateEnabled = (meta?.enableAggregation ?? false) === true;

    if (!aggregateEnabled) {
      // 不启用聚合展示时，保持单元格为空以避免误解
      return (
        <td key={cell.id} className='mt-grid-td' style={cellStickyStyle} />
      );
    }

    const rawValue = cell.getValue() as unknown;
    let displayValue: React.ReactNode = rawValue as React.ReactNode;

    if (
      typeof rawValue === 'number' &&
      typeof meta?.aggregationFormatter === 'function'
    ) {
      displayValue = meta.aggregationFormatter(
        rawValue,
        meta.defaultAggregation ?? 'sum'
      );
    }

    return (
      <td
        key={cell.id}
        className='mt-grid-td bg-muted/40 text-muted-foreground text-xs'
        style={cellStickyStyle}
      >
        {displayValue}
      </td>
    );
  }

  const drafts = state.runtime.editingDraftValues;
  const draftValue =
    drafts && Object.prototype.hasOwnProperty.call(drafts, cellKey)
      ? drafts[cellKey]
      : undefined;
  const cellValue = cell.getValue();

  const isEditing =
    !!state.runtime.editingCell &&
    state.runtime.editingCell.rowKey === rowKey &&
    state.runtime.editingCell.columnId === columnId;

  // 检查是否有待提交的编辑
  const pendingEdit = state.runtime.pendingEdits.find(
    (e) => e.rowKey === String(rowKey)
  );
  const hasPendingEdit =
    pendingEdit?.editedRow &&
    Object.prototype.hasOwnProperty.call(pendingEdit.editedRow, columnId);
  const pendingValue = hasPendingEdit
    ? (pendingEdit.editedRow as any)[columnId]
    : undefined;
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

  const validateBeforeCommit = (next: unknown): string | null => {
    if (!columnSchema?.safeParse) return null;
    const result = columnSchema.safeParse(next);
    if (result.success) return null;
    const firstIssue =
      (result as any).error?.issues?.[0]?.message ?? '无效的值';
    return firstIssue;
  };

  const setError = (msg: string | null) => {
    store.getState().setValidationError(cellKey, msg);
  };

  // 防抖处理编辑草稿值更新
  const debouncedDispatchChange = useDebouncedCallback(
    (cell: { rowKey: string; columnId: string }, value: unknown) => {
      store
        .getState()
        .updateDraft({ rowKey: cell.rowKey, columnId: cell.columnId }, value);
    },
    150
  );

  // 节流处理验证
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

  const isNumberLike = meta?.type === 'number' || meta?.type === 'integer';
  const isBooleanLike =
    meta?.type === 'boolean' || meta?.editorType === 'checkbox';
  const isTextLike = meta?.editorType === 'text' || meta?.type === 'string';

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
          const targetColumn = allVisibleColumns[target.columnIndex];
          const targetCell = targetRow.getVisibleCells()[target.columnIndex];
          const targetValue = targetCell.getValue();

          store.getState().startEditing(
            {
              rowKey: targetRow.id,
              columnId: targetColumn.id
            },
            targetValue
          );
        }}
        onStartEdit={() => {
          if (!meta?.editable) return;
          const current = store.getState();
          if (
            current.runtime.editingCell &&
            (current.runtime.editingCell.rowKey !== rowKey ||
              current.runtime.editingCell.columnId !== columnId)
          ) {
            store.getState().cancelEditing({
              rowKey: current.runtime.editingCell.rowKey,
              columnId: current.runtime.editingCell.columnId
            });
          }
          store.getState().startEditing({ rowKey, columnId }, cellValue);
        }}
        onChangeDraft={(val) => {
          debouncedDispatchChange({ rowKey, columnId }, val);
          throttledValidate(() => validateBeforeCommit(val), setError);
        }}
        onCommit={(nextNumber) => {
          const msg = validateBeforeCommit(nextNumber);
          if (msg) {
            setError(msg);
            return;
          }
          setError(null);

          if (editMode === 'immediate') {
            store.getState().updateRow(
              rowKey as RowKey,
              {
                ...(row.original as any),
                [columnId]: nextNumber
              } as any
            );
            store.getState().commitEditing({ rowKey, columnId });
          } else {
            store.getState().queueEdit({ rowKey, columnId }, nextNumber);
            store.getState().commitEditing({ rowKey, columnId });
          }
        }}
        onCancel={() => store.getState().cancelEditing({ rowKey, columnId })}
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
          const current = store.getState();
          if (
            current.runtime.editingCell &&
            (current.runtime.editingCell.rowKey !== rowKey ||
              current.runtime.editingCell.columnId !== columnId)
          ) {
            store.getState().cancelEditing({
              rowKey: current.runtime.editingCell.rowKey,
              columnId: current.runtime.editingCell.columnId
            });
          }
          store.getState().startEditing({ rowKey, columnId }, cellValue ?? '');
        }}
        onChangeDraft={(val) => {
          debouncedDispatchChange({ rowKey, columnId }, val);
          throttledValidate(() => validateBeforeCommit(val), setError);
        }}
        onCommit={(nextText) => {
          const msg = validateBeforeCommit(nextText);
          if (msg) {
            setError(msg);
            return;
          }
          setError(null);

          if (editMode === 'immediate') {
            store.getState().updateRow(
              rowKey as RowKey,
              {
                ...(row.original as any),
                [columnId]: nextText
              } as any
            );
            store.getState().commitEditing({ rowKey, columnId });
          } else {
            store.getState().queueEdit({ rowKey, columnId }, nextText);
            store.getState().commitEditing({ rowKey, columnId });
          }
        }}
        onCancel={() => store.getState().cancelEditing({ rowKey, columnId })}
        onMoveFocus={(direction) => {
          const target = findNextEditableCellIndex(
            direction,
            row.index,
            cellIndex
          );
          if (!target) return;
          const targetRow = rows[target.rowIndex];
          const targetColumn = allVisibleColumns[target.columnIndex];
          const targetCell = targetRow.getVisibleCells()[target.columnIndex];
          const targetValue = targetCell.getValue() ?? '';

          store.getState().startEditing(
            {
              rowKey: targetRow.id,
              columnId: targetColumn.id
            },
            targetValue
          );
        }}
      />
    );
  }

  if (isBooleanLike) {
    const pendingEditForCheckbox = state.runtime.pendingEdits.find(
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
        error={isEditing || hasPendingEditForCheckbox ? rawError : null}
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
            store.getState().updateRow(
              rowKey as RowKey,
              {
                ...(row.original as any),
                [columnId]: rawValue
              } as any
            );
          } else {
            store.getState().queueEdit({ rowKey, columnId }, rawValue);
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
              const hoverBg = isRowSelected
                ? 'color-mix(in oklch, var(--primary) 20%, var(--background))'
                : 'color-mix(in oklch, var(--muted) 40%, var(--background))';
              (e.currentTarget as HTMLElement).style.backgroundColor = hoverBg;
            }
          : undefined
      }
      onMouseLeave={
        pinned
          ? (e) => {
              const originalBg = isRowSelected
                ? 'color-mix(in oklch, var(--primary) 10%, var(--background))'
                : 'var(--background)';
              (e.currentTarget as HTMLElement).style.backgroundColor =
                originalBg;
            }
          : undefined
      }
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext()) ??
        String(cellValue ?? '')}
    </td>
  );
}
