'use client';

import * as React from 'react';
import type { ColumnConfig, DataSource } from '@maita-table/core';
import type { DataGridViewState } from '@maita-table/core';
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  useReactTable
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataGrid } from './useDataGrid';

export interface DataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
  estimateRowHeight?: number;
  initialViewState?: Partial<DataGridViewState<Row>>;
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const { columns, estimateRowHeight = 36 } = props;
  const { state } = useDataGrid<Row>(props);

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns]
  );

  const columnDefs = React.useMemo<Array<ColumnDef<Row>>>(() => {
    return visibleColumns.map((col) => {
      return {
        id: col.id,
        header: () => col.header,
        accessorFn: (row) => col.accessor(row)
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
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className='mt-grid-td px-3 py-2 align-middle whitespace-nowrap'
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
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
