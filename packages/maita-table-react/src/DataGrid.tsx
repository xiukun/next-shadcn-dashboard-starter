'use client';

import * as React from 'react';
import type { ColumnConfig, DataSource, ColumnMeta } from '@maita-table/core';
import type { DataGridViewState } from '@maita-table/core';
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

export type EditMode = 'immediate' | 'single-row' | 'batch';

export interface DataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  estimateRowHeight?: number;
  initialViewState?: Partial<DataGridViewState<Row>>;
  editMode?: EditMode;
  onSubmit?: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const {
    columns,
    estimateRowHeight = 36,
    editMode = 'immediate',
    onSubmit
  } = props;
  const { state, store } = useDataGrid<Row>(props);

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns]
  );

  const columnDefs = React.useMemo<Array<ColumnDef<Row>>>(() => {
    return visibleColumns.map((col) => {
      return {
        id: col.id,
        header: () => col.header,
        accessorFn: (row) => col.accessor(row),
        // 由于 TanStack Table 的 ColumnMeta 类型与 core 中的 ColumnMeta 不同，这里仅做透传，类型上保持为 any
        // 由 DataGrid 内部按约定字段读取（editable/editorType 等）
        meta: col.meta as any
      };
    });
  }, [visibleColumns]);

  const table = useReactTable({
    data: state.data.rows,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel()
  });

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;

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
    const colCount = visibleColumns.length;

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

      const nextColumn = visibleColumns[c];
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

  return (
    <div className='mt-grid bg-card rounded-lg border text-sm'>
      <div
        ref={parentRef}
        className='mt-grid-viewport bg-background relative w-full overflow-auto rounded-lg'
        style={{ height: 480 }}
      >
        <table className='mt-grid-table w-full'>
          <thead className='mt-grid-thead bg-muted/40 sticky top-0 z-10 backdrop-blur'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className='mt-grid-tr border-b'>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className='mt-grid-th text-muted-foreground h-9 px-3 text-left text-xs font-medium'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className='mt-grid-tbody' onClick={handleTbodyClick}>
            {paddingTop > 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
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

                    const error = state.runtime.validationErrors[cellKey];

                    const validateBeforeCommit = (
                      next: unknown
                    ): string | null => {
                      if (meta?.validate) {
                        const msg = meta.validate(
                          next as any,
                          row.original as any
                        );
                        return msg ?? null;
                      }
                      return null;
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
                          value={cellValue}
                          draftValue={draftValue}
                          meta={meta}
                          isEditing={!!meta?.editable && isEditing}
                          error={error}
                          onMoveFocus={(direction) => {
                            const target = findNextEditableCellIndex(
                              direction,
                              row.index,
                              cellIndex
                            );
                            if (!target) return;
                            const targetRow = rows[target.rowIndex];
                            const targetColumn =
                              visibleColumns[target.columnIndex];
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
                            store.dispatch({
                              type: 'edit/change',
                              cell: { rowKey, columnId },
                              value: val
                            });
                            // 即时校验：输入过程中如果已通过校验，及时清除错误样式
                            const msg = validateBeforeCommit(val);
                            setError(msg);
                          }}
                          onCommit={(nextNumber) => {
                            const msg = validateBeforeCommit(nextNumber);
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
                              // 单行或批量模式：加入队列
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
                          value={cellValue}
                          draftValue={draftValue}
                          meta={meta}
                          isEditing={!!meta?.editable && isEditing}
                          error={error}
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
                            store.dispatch({
                              type: 'edit/change',
                              cell: { rowKey, columnId },
                              value: val
                            });
                            const msg = validateBeforeCommit(val);
                            setError(msg);
                          }}
                          onCommit={(nextText) => {
                            const msg = validateBeforeCommit(nextText);
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
                              // 单行或批量模式：加入队列
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
                              visibleColumns[target.columnIndex];
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
                      return (
                        <CheckboxCell
                          key={cell.id}
                          value={cellValue}
                          meta={meta}
                          error={error}
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
                          error ? 'text-destructive' : ''
                        }`}
                        title={error}
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
                  colSpan={visibleColumns.length}
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
          />
        </div>
      )}
    </div>
  );
}
