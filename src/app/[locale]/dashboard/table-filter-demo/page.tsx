'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ColumnConfig, RowKey } from '@maita-table/core';
import { createNextDataSource } from '@maita-table/next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  change: number;
  status: 'active' | 'archived';
  createdAt: string; // 用于日期过滤测试
};

const dataSource = createNextDataSource<DemoRow>('/api/maita-table-demo');

// DataGrid 仅在客户端渲染
const DataGrid = dynamic(
  async () => {
    const mod = await import('@maita-table/react');
    return { default: mod.DataGrid };
  },
  {
    ssr: false
  }
) as React.ComponentType<import('@maita-table/react').DataGridProps<DemoRow>>;

export default function Page() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<RowKey[]>([]);
  const t = useTranslations('data-grid');

  // 配置列，启用过滤和排序功能
  const columns: ColumnConfig<DemoRow>[] = [
    {
      id: 'id',
      header: 'ID',
      accessor: (row) => row.id,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤 ID...'
      }
    },
    {
      id: 'name',
      header: '名称',
      accessor: (row) => row.name,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'text',
        enableFloatingFilter: true,
        filterPlaceholder: '搜索名称...'
      }
    },
    {
      id: 'price',
      header: '价格',
      accessor: (row) => row.price,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤价格...',
        align: 'right'
      }
    },
    {
      id: 'change',
      header: '变化',
      accessor: (row) => row.change,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: false, // 不启用浮动过滤，只使用过滤菜单
        align: 'right'
      }
    },
    {
      id: 'status',
      header: '状态',
      accessor: (row) => row.status,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'text',
        enableFloatingFilter: false
      }
    },
    {
      id: 'createdAt',
      header: '创建日期',
      accessor: (row) =>
        row.createdAt || new Date().toISOString().split('T')[0],
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'date',
        enableFloatingFilter: true,
        filterPlaceholder: '选择日期...'
      }
    }
  ];

  const handleSelectionChange = (keys: RowKey[]) => {
    setSelectedRowKeys(keys);
  };

  const handleClearFilters = () => {
    // 这个功能需要在 DataGrid 中实现
    toast.info('清除过滤功能待实现');
  };

  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>表格过滤功能演示</h1>
        <p className='text-muted-foreground text-sm'>
          测试 DataGrid 的过滤功能：浮动过滤器、过滤菜单、排序等
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-4'>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>
            已选择 {selectedRowKeys.length} 行
          </span>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleClearFilters}>
            清除所有过滤
          </Button>
        </div>
      </div>

      <div className='bg-card rounded-lg border p-4'>
        <div className='mb-4 space-y-2'>
          <h2 className='text-lg font-semibold'>功能说明</h2>
          <ul className='text-muted-foreground list-inside list-disc space-y-1 text-sm'>
            <li>
              <strong>浮动过滤器：</strong>
              在表头下方显示输入框，实时过滤（ID、名称、价格、创建日期列）
            </li>
            <li>
              <strong>过滤菜单：</strong>
              点击过滤图标打开菜单，支持多种操作符（变化、状态列）
            </li>
            <li>
              <strong>排序：</strong>
              点击列标题或排序图标进行排序，支持多列排序（Ctrl/Cmd + 点击）
            </li>
            <li>
              <strong>文本过滤：</strong>支持
              contains、startsWith、endsWith、equals 等操作符
            </li>
            <li>
              <strong>数字过滤：</strong>支持 &gt;、&lt;、=、between 等操作符
            </li>
            <li>
              <strong>日期过滤：</strong>支持日期选择器和日期范围过滤
            </li>
          </ul>
        </div>

        <DataGrid
          id='maita-table-filter-demo'
          columns={columns}
          dataSource={dataSource}
          initialViewState={{
            pageSize: 20,
            columnsPinned: { id: 'left' }
          }}
          showHeaderVerticalDividers
          CheckboxComponent={Checkbox}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
          enableRowSelection={true}
          selectionMode='multiple'
          enableSelectionPersistence={true}
          // 开启分页示例：服务端分页 + 分页控件
          enablePagination={true}
          paginationMode='server'
          initialPageIndex={0}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50]}
          columnMenuLabels={{
            sortAsc: t('columnMenu.sortAsc'),
            sortDesc: t('columnMenu.sortDesc'),
            clearSort: t('columnMenu.clearSort'),
            filter: t('columnMenu.filter'),
            clearFilter: t('columnMenu.clearFilter'),
            pinLeft: t('columnMenu.pinLeft'),
            pinRight: t('columnMenu.pinRight'),
            unpin: t('columnMenu.unpin'),
            autoResizeColumn: t('columnMenu.autoResizeColumn')
          }}
        />
      </div>
    </div>
  );
}
