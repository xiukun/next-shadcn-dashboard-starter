'use client';

import { DataGrid } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';
import type { ColumnConfig } from '@maita-table/core';
import { useTranslations } from 'next-intl';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  change: number;
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
      accessor: (row) => row.name,
      meta: {
        type: 'string',
        editable: true,
        editorType: 'text',
        maxLength: 30,
        validate: (value: string) => {
          const v = value?.trim?.() ?? '';
          if (!v) return t('errors.nameRequired' as any);
          if (v.length > 10) return t('errors.nameTooLong' as any);
          return null;
        }
      }
    },
    {
      id: 'price',
      header: t('columns.price'),
      accessor: (row) => row.price,
      meta: {
        type: 'number',
        editable: true,
        editorType: 'number',
        min: 0,
        max: 9999,
        decimals: 2,
        step: 0.1,
        allowNegative: false,
        align: 'right',
        locale: 'zh-CN',
        thousandSeparator: true,
        currency: 'CNY',
        formatStyle: 'currency',
        colorBySign: true
      }
    },
    {
      id: 'change',
      header: t('columns.change'),
      accessor: (row) => row.change,
      meta: {
        type: 'number',
        editable: false,
        editorType: 'number',
        min: -1,
        max: 1,
        decimals: 1,
        step: 0.1,
        allowNegative: true,
        align: 'right',
        formatStyle: 'percent',
        colorBySign: true
      }
    },
    {
      id: 'status',
      header: t('columns.status'),
      accessor: (row) => row.status === 'active',
      meta: {
        type: 'boolean',
        editable: true,
        editorType: 'checkbox',
        trueValue: 'active',
        falseValue: 'archived'
      }
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
