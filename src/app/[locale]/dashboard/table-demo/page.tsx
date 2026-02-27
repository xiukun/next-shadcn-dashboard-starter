'use client';

import { DataGrid } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';
import type { ColumnConfig } from '@maita-table/core';
import { useTranslations } from 'next-intl';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  status: 'active' | 'archived';
};

const dataSource = createNextDataSource<DemoRow>('/api/maita-table-demo');

export default function Page() {
  const t = useTranslations('maita-table-demo');

  const columns: ColumnConfig<DemoRow>[] = [
    {
      id: 'id',
      header: t('columns.id'),
      accessor: (row) => row.id
    },
    {
      id: 'name',
      header: t('columns.name'),
      accessor: (row) => row.name
    },
    {
      id: 'price',
      header: t('columns.price'),
      accessor: (row) => row.price
    },
    {
      id: 'status',
      header: t('columns.status'),
      accessor: (row) => row.status
    }
  ];

  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <DataGrid<DemoRow>
        id='maita-table-demo'
        columns={columns}
        dataSource={dataSource}
        initialViewState={{ pageSize: 10000 }}
      />
    </div>
  );
}
