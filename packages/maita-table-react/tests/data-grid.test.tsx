import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type {
  ColumnConfig,
  DataGridQuery,
  DataGridResult,
  DataSource
} from '@maita-table/core';
import { DataGrid } from '../src/DataGrid';

interface Row {
  id: number;
  name: string;
}

function createDataSource(rows: Row[]): DataSource<Row> {
  return {
    fetch: vi.fn(
      async (_query: DataGridQuery): Promise<DataGridResult<Row>> => {
        return { rows, totalRowCount: rows.length };
      }
    )
  };
}

describe('<DataGrid />', () => {
  it('renders rows from data source', async () => {
    const rows: Row[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];

    const columns: ColumnConfig<Row>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name
      }
    ];

    const dataSource = createDataSource(rows);

    render(
      <DataGrid<Row> id='test-grid' columns={columns} dataSource={dataSource} />
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });
});
