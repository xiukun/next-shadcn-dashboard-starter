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

export interface DataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  estimateRowHeight?: number;
  initialViewState?: Partial<DataGridViewState<Row>>;
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const { columns, estimateRowHeight = 36 } = props;
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
          <tbody className='mt-grid-tbody'>
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
                  {row.getVisibleCells().map((cell) => {
                    const columnId = cell.column.id;
                    const meta = cell.column
                      .columnDef.meta as ColumnMeta<Row> | undefined;
                    const rowKey = row.id;
                    const cellKey = `${rowKey}:${columnId}`;
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

                    const isNumberLike =
                      meta?.type === 'number' || meta?.type === 'integer';

                    if (isNumberLike) {
                      return (
                        <NumberCell
                          key={cell.id}
                          value={cellValue}
                          draftValue={draftValue}
                          meta={meta}
                          isEditing={!!meta?.editable && isEditing}
                          onStartEdit={() => {
                            if (!meta?.editable) return;
                            store.dispatch({
                              type: 'edit/start',
                              cell: { rowKey, columnId },
                              initialValue: cellValue
                            });
                          }}
                          onChangeDraft={(val) =>
                            store.dispatch({
                              type: 'edit/change',
                              cell: { rowKey, columnId },
                              value: val
                            })
                          }
                          onCommit={(nextNumber) => {
                            const current = store.getState();
                            const nextRows = current.data.rows.map((r, index) => {
                              if (index !== row.index) return r;
                              if (nextNumber == null) return r;
                              return {
                                ...(r as any),
                                [columnId]: nextNumber
                              };
                            });
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

                    return (
                      <td
                        key={cell.id}
                        className='mt-grid-td px-3 py-2 align-middle whitespace-nowrap'
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
    </div>
  );
}
