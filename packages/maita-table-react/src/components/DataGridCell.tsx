'use client';

import * as React from 'react';
import { flexRender } from '@tanstack/react-table';
import type { Cell, Row } from '@tanstack/react-table';
import type { ColumnConfig, ColumnMeta, RowKey } from '@maita-table/core';
import { createColumnSchema } from '@maita-table/core';
import { NumberCell } from '../cells/number-cell';
import { TextCell } from '../cells/text-cell';
import { CheckboxCell } from '../cells/checkbox-cell';
import type { DataGridStore } from '../store/index';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useThrottledCallback } from '../hooks/useThrottle';
import type { EditMode } from '../DataGrid';

export interface DataGridCellProps<Row> {
  cell: Cell<Row, unknown>;
  row: Row<Row>;
  cellIndex: number;
  column: ColumnConfig<Row>;
  allVisibleColumns: ColumnConfig<Row>[];
  rows: Row<Row>[];
  store: DataGridStore<Row>;
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

export function DataGridCell<Row>(props: DataGridCellProps<Row>) {
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
  const meta = cell.column.columnDef.meta as ColumnMeta<Row> | undefined;
  const rowKey = row.id;
  const cellKey = `${rowKey}:${columnId}`;

  const state = store.getState();
  const viewState = state.view;
  const pinned = viewState.columnsPinned?.[columnId];

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

  const cellStickyStyle: React.CSSProperties =
    pinned === 'left'
      ? {
          position: 'sticky',
          left: cellLeftOffset,
          zIndex: 20,
          backgroundColor: fixedCellBackgroundColor,
          boxShadow: '2px 0 4px -2px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.15s ease-in-out'
        }
      : pinned === 'right'
        ? {
            position: 'sticky',
            right: cellRightOffset,
            zIndex: 20,
            backgroundColor: fixedCellBackgroundColor,
            boxShadow: '-2px 0 4px -2px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.15s ease-in-out'
          }
        : {};

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
