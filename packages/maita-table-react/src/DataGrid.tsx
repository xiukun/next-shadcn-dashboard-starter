import * as React from 'react';
import type { ColumnConfig, DataSource } from '@maita-table/core';
import { useDataGrid } from './useDataGrid';

export interface DataGridProps<Row> {
  id: string;
  columns: ColumnConfig<Row>[];
  dataSource: DataSource<Row>;
}

export function DataGrid<Row>(props: DataGridProps<Row>) {
  const { columns } = props;
  const { state } = useDataGrid<Row>(props);

  const visibleColumns = React.useMemo(
    () => columns.filter((col) => col.visible !== false),
    [columns]
  );

  return (
    <table className='mt-grid'>
      <thead>
        <tr>
          {visibleColumns.map((col) => (
            <th key={col.id}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {state.data.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {visibleColumns.map((col) => {
              const value = col.accessor(row as Row);
              return <td key={col.id}>{String(value)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
