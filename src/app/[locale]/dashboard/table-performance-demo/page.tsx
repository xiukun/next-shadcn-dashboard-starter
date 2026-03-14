'use client';

import { useState } from 'react';
import * as React from 'react';
import dynamic from 'next/dynamic';
import type {
  ColumnConfig,
  RowKey,
  DataSource,
  DataGridQuery,
  DataGridResult
} from '@maita-table/core';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { exportToCSV, exportSelectedRowsToCSV } from '@maita-table/react';
// 临时在页面中实现导出功能，等待包重新构建后可以改为从 @maita-table/react 导入

type PerformanceRow = {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  age: number;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  performance: number;
  projects: number;
};

// 创建模拟数据源
const createMockDataSource = (rowCount: number): DataSource<PerformanceRow> => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const statuses: ('active' | 'inactive' | 'pending')[] = [
    'active',
    'inactive',
    'pending'
  ];

  const mockData: PerformanceRow[] = Array.from(
    { length: rowCount },
    (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      department: departments[i % departments.length],
      salary: Math.floor(Math.random() * 100000) + 50000,
      age: Math.floor(Math.random() * 30) + 25,
      status: statuses[i % statuses.length],
      joinDate: new Date(2020 + (i % 4), i % 12, (i % 28) + 1)
        .toISOString()
        .split('T')[0],
      performance: Math.floor(Math.random() * 100),
      projects: Math.floor(Math.random() * 20)
    })
  );

  return {
    async fetch(
      query: DataGridQuery,
      signal?: AbortSignal
    ): Promise<DataGridResult<PerformanceRow>> {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 检查是否已取消
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      let filtered = [...mockData];

      // 应用过滤
      if (query.filters && query.filters.length > 0) {
        query.filters.forEach((filter) => {
          filtered = filtered.filter((row) => {
            const value = (row as Record<string, unknown>)[filter.id];
            // 简单的过滤逻辑
            if (filter.op === 'eq') {
              return value === filter.value;
            }
            if (filter.op === 'ne') {
              return value !== filter.value;
            }
            if (
              filter.op === 'gt' &&
              typeof value === 'number' &&
              typeof filter.value === 'number'
            ) {
              return value > filter.value;
            }
            if (
              filter.op === 'gte' &&
              typeof value === 'number' &&
              typeof filter.value === 'number'
            ) {
              return value >= filter.value;
            }
            if (
              filter.op === 'lt' &&
              typeof value === 'number' &&
              typeof filter.value === 'number'
            ) {
              return value < filter.value;
            }
            if (
              filter.op === 'lte' &&
              typeof value === 'number' &&
              typeof filter.value === 'number'
            ) {
              return value <= filter.value;
            }
            if (filter.op === 'contains' && typeof value === 'string') {
              return value
                .toLowerCase()
                .includes(String(filter.value || '').toLowerCase());
            }
            return true;
          });
        });
      }

      // 应用排序
      if (query.sort && query.sort.length > 0) {
        filtered.sort((a, b) => {
          for (const sort of query.sort!) {
            const aVal = (a as Record<string, unknown>)[sort.id];
            const bVal = (b as Record<string, unknown>)[sort.id];
            // 类型安全的比较
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              if (aVal < bVal) return sort.desc ? 1 : -1;
              if (aVal > bVal) return sort.desc ? -1 : 1;
            } else {
              const aStr = String(aVal || '');
              const bStr = String(bVal || '');
              if (aStr < bStr) return sort.desc ? 1 : -1;
              if (aStr > bStr) return sort.desc ? -1 : 1;
            }
          }
          return 0;
        });
      }

      // 应用分页
      const pageIndex = query.page?.index || 0;
      const pageSize = query.page?.size || 20;
      const start = pageIndex * pageSize;
      const end = start + pageSize;
      const paginated = filtered.slice(start, end);

      return {
        rows: paginated,
        totalRowCount: filtered.length
      };
    }
  };
};

// DataGrid 仅在客户端渲染
const DataGrid = dynamic(
  async () => {
    const mod = await import('@maita-table/react');
    return { default: mod.DataGrid };
  },
  {
    ssr: false
  }
) as React.ComponentType<
  import('@maita-table/react').DataGridProps<PerformanceRow>
>;

export default function Page() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<RowKey[]>([]);
  const [rowCount, setRowCount] = useState(1000);
  const [dataSource, setDataSource] = useState(() =>
    createMockDataSource(1000)
  );
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [allRows, setAllRows] = useState<PerformanceRow[]>([]);
  const t = useTranslations('data-grid');

  // 配置列
  const columns: ColumnConfig<PerformanceRow>[] = [
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
      header: '姓名',
      accessor: (row) => row.name,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'text',
        enableFloatingFilter: true,
        filterPlaceholder: '搜索姓名...'
      }
    },
    {
      id: 'email',
      header: '邮箱',
      accessor: (row) => row.email,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'text',
        enableFloatingFilter: true,
        filterPlaceholder: '搜索邮箱...'
      }
    },
    {
      id: 'department',
      header: '部门',
      accessor: (row) => row.department,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'text',
        enableFloatingFilter: false
      }
    },
    {
      id: 'salary',
      header: '薪资',
      accessor: (row) => row.salary,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤薪资...',
        align: 'right',
        format: (value: unknown) => `$${Number(value).toLocaleString()}`
      }
    },
    {
      id: 'age',
      header: '年龄',
      accessor: (row) => row.age,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤年龄...',
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
      id: 'joinDate',
      header: '入职日期',
      accessor: (row) => row.joinDate,
      enableSorting: true,
      meta: {
        enableFiltering: true,
        filterType: 'date',
        enableFloatingFilter: true,
        filterPlaceholder: '选择日期...'
      }
    },
    {
      id: 'performance',
      header: '绩效',
      accessor: (row) => row.performance,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤绩效...',
        align: 'right'
      }
    },
    {
      id: 'projects',
      header: '项目数',
      accessor: (row) => row.projects,
      enableSorting: true,
      meta: {
        type: 'number',
        enableFiltering: true,
        filterType: 'number',
        enableFloatingFilter: true,
        filterPlaceholder: '过滤项目数...',
        align: 'right'
      }
    }
  ];

  const handleSelectionChange = (keys: RowKey[]) => {
    setSelectedRowKeys(keys);
  };

  const handleRowCountChange = (newCount: number) => {
    setRowCount(newCount);
    const startTime = performance.now();
    const newDataSource = createMockDataSource(newCount);
    setDataSource(newDataSource);

    // 获取所有数据用于导出
    newDataSource
      .fetch({ sort: [], filters: [], page: { index: 0, size: newCount } })
      .then((result: DataGridResult<PerformanceRow>) => {
        setAllRows(result.rows || []);
      });

    // 等待下一个渲染周期后计算时间
    setTimeout(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
    }, 100);
  };

  // 初始化时获取数据
  React.useEffect(() => {
    dataSource
      .fetch({ sort: [], filters: [], page: { index: 0, size: rowCount } })
      .then((result: DataGridResult<PerformanceRow>) => {
        setAllRows(result.rows || []);
      });
  }, [dataSource, rowCount]);

  const handleExportCSV = () => {
    if (allRows.length === 0) {
      toast.error('没有数据可导出');
      return;
    }

    try {
      exportToCSV(allRows, columns, {
        filename: `performance-data-${rowCount}-rows.csv`,
        includeHeaders: true
      });
      toast.success(`成功导出 ${allRows.length} 行数据`);
    } catch (error) {
      toast.error(
        '导出失败: ' + (error instanceof Error ? error.message : '未知错误')
      );
    }
  };

  const handleExportSelectedCSV = () => {
    if (selectedRowKeys.length === 0) {
      toast.error('请先选择要导出的行');
      return;
    }

    try {
      exportSelectedRowsToCSV(allRows, selectedRowKeys as string[], columns, {
        filename: `selected-rows-${selectedRowKeys.length}.csv`,
        includeHeaders: true
      });
      toast.success(`成功导出 ${selectedRowKeys.length} 行选中数据`);
    } catch (error) {
      toast.error(
        '导出失败: ' + (error instanceof Error ? error.message : '未知错误')
      );
    }
  };

  return (
    <div className='space-y-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>DataGrid 性能测试</h1>
        <p className='text-muted-foreground text-sm'>
          测试 DataGrid 在大数据量下的性能表现，对比 ag-grid 的功能特性
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>数据量控制</CardTitle>
            <CardDescription>调整测试数据行数</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleRowCountChange(1000)}
              >
                1K
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleRowCountChange(5000)}
              >
                5K
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleRowCountChange(10000)}
              >
                10K
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleRowCountChange(50000)}
              >
                50K
              </Button>
            </div>
            <div className='text-muted-foreground text-xs'>
              当前数据量:{' '}
              <Badge variant='secondary'>{rowCount.toLocaleString()}</Badge> 行
            </div>
            {renderTime && (
              <div className='text-muted-foreground text-xs'>
                渲染时间:{' '}
                <Badge variant='secondary'>{renderTime.toFixed(2)}ms</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>选择状态</CardTitle>
            <CardDescription>当前选择的行数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{selectedRowKeys.length}</div>
            <div className='text-muted-foreground text-xs'>已选择行</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>操作</CardTitle>
            <CardDescription>导出和测试功能</CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportCSV}
              className='w-full'
            >
              导出全部 CSV
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleExportSelectedCSV}
              className='w-full'
              disabled={selectedRowKeys.length === 0}
            >
              导出选中 ({selectedRowKeys.length})
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>性能测试表格</CardTitle>
          <CardDescription>
            测试大数据量下的虚拟滚动、排序、过滤、分页等功能的性能表现
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataGrid
            id='maita-table-performance-demo'
            columns={columns}
            dataSource={dataSource}
            initialViewState={{
              pageSize: 50,
              columnsPinned: { id: 'left', name: 'left' }
            }}
            showHeaderVerticalDividers
            CheckboxComponent={Checkbox}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={handleSelectionChange}
            enableRowSelection={true}
            selectionMode='multiple'
            enableSelectionPersistence={true}
            enablePagination={true}
            paginationMode='server'
            initialPageIndex={0}
            initialPageSize={50}
            pageSizeOptions={[20, 50, 100, 200]}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>功能对比清单</CardTitle>
          <CardDescription>与 ag-grid 的功能对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>虚拟滚动（Virtual Scrolling）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>列固定（Column Pinning）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>列调整大小（Column Resizing）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>列排序（Column Sorting）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>列过滤（Column Filtering）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>行选择（Row Selection）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='default'>✅</Badge>
              <span>分页（Pagination）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>❌</Badge>
              <span>CSV 导出（CSV Export）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>❌</Badge>
              <span>行分组（Row Grouping）</span>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>❌</Badge>
              <span>列聚合（Column Aggregation）</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
