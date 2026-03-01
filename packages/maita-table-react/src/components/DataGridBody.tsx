'use client';

import * as React from 'react';
import type { Row, Cell } from '@tanstack/react-table';
import type { ColumnConfig, RowKey } from '@maita-table/core';
import { SelectionCheckbox } from './SelectionCheckbox';
import { DataGridCell } from './DataGridCell';
import type { DataGridStore } from '../store';
import type { EditMode } from '../DataGrid';
import type { UseRowSelectionResult } from '../hooks/useRowSelection';

export interface DataGridBodyProps<TRow> {
  rows: Row<TRow>[];
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  paddingTop: number;
  paddingBottom: number;
  allVisibleColumns: ColumnConfig<TRow>[];
  store: DataGridStore<TRow>;
  columnSchemas: Record<string, unknown>;
  editMode: EditMode;
  enableRowSelection: boolean;
  selection: UseRowSelectionResult;
  onRowToggle: (rowKey: RowKey, event?: React.MouseEvent) => void;
  CheckboxComponent?: React.ComponentType<{
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    'aria-checked'?: boolean | 'mixed';
  }>;
  findNextEditableCellIndex: (
    direction: 'next' | 'prev',
    rowIndex: number,
    columnIndex: number
  ) => { rowIndex: number; columnIndex: number } | null;
  onTbodyClick: (e: React.MouseEvent<HTMLTableSectionElement>) => void;
}

export function DataGridBody<TRow>(props: DataGridBodyProps<TRow>) {
  const {
    rows,
    virtualItems,
    paddingTop,
    paddingBottom,
    allVisibleColumns,
    store,
    columnSchemas,
    editMode,
    enableRowSelection,
    selection,
    onRowToggle,
    CheckboxComponent,
    findNextEditableCellIndex,
    onTbodyClick
  } = props;

  return (
    <tbody
      className='mt-grid-tbody'
      onClick={onTbodyClick}
      style={{ position: 'relative', zIndex: 0 }}
    >
      {paddingTop > 0 && (
        <tr>
          <td
            colSpan={allVisibleColumns.length + (enableRowSelection ? 1 : 0)}
            style={{ height: paddingTop }}
          />
        </tr>
      )}
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
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
                onToggle={(event) => onRowToggle(rowKey, event)}
                CheckboxComponent={CheckboxComponent}
              />
            )}
            {row
              .getVisibleCells()
              .map((cell: Cell<TRow, unknown>, cellIndex: number) => {
                const column = allVisibleColumns.find(
                  (c) => c.id === cell.column.id
                );
                if (!column) return null;

                return (
                  <DataGridCell
                    key={cell.id}
                    cell={cell}
                    row={row}
                    cellIndex={cellIndex}
                    column={column}
                    allVisibleColumns={allVisibleColumns}
                    rows={rows}
                    store={store}
                    columnSchemas={columnSchemas}
                    editMode={editMode}
                    isRowSelected={isRowSelected}
                    enableRowSelection={enableRowSelection}
                    findNextEditableCellIndex={findNextEditableCellIndex}
                  />
                );
              })}
          </tr>
        );
      })}
      {paddingBottom > 0 && (
        <tr>
          <td
            colSpan={allVisibleColumns.length + (enableRowSelection ? 1 : 0)}
            style={{ height: paddingBottom }}
          />
        </tr>
      )}
    </tbody>
  );
}
