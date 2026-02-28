'use client';

import { useState } from 'react';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import type { EditMode } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';
import type { ColumnConfig } from '@maita-table/core';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  change: number;
  status: 'active' | 'archived';
};

const dataSource = createNextDataSource<DemoRow>('/api/maita-table-demo');

// DataGrid 仅在客户端渲染，避免在 SSR 阶段引入虚拟化/DOM 相关逻辑导致水合差异
const DataGrid = dynamic(
  async () => {
    const mod = await import('@maita-table/react');
    return mod.DataGrid as typeof mod.DataGrid;
  },
  {
    ssr: false
  }
);

export default function Page() {
  const t = useTranslations('maita-table-demo');
  const [editMode, setEditMode] = useState<EditMode>('immediate');

  // 基础 5 列
  const baseColumns: ColumnConfig<DemoRow>[] = [
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
        zodSchema: z
          .string()
          .trim()
          .min(1, { message: t('errors.nameRequired' as any) })
          .max(10, { message: t('errors.nameTooLong' as any) })
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

  // 额外派生列，用于压测列虚拟化（共 40 列：5 基础 + 35 扩展）
  const extraColumns: ColumnConfig<DemoRow>[] = Array.from(
    { length: 35 },
    (_, index) => {
      const i = index + 1;
      return {
        id: `extra_${i}`,
        header: t('columns.extra', { index: i }),
        accessor: (row) => `${row.name} #${i}`,
        meta: {
          type: 'string'
        }
      };
    }
  );

  const columns: ColumnConfig<DemoRow>[] = [...baseColumns, ...extraColumns];

  const handleSubmit = async (
    edits: Array<{ rowKey: string; row: DemoRow }>
  ) => {
    try {
      const response = await fetch('/api/maita-table-demo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits })
      });

      if (!response.ok) {
        throw new Error('提交失败');
      }

      const result = await response.json();
      console.log('提交成功:', result);
      toast.success(`成功提交 ${edits.length} 行数据`);
    } catch (error) {
      console.error('提交错误:', error);
      toast.error(`提交失败: ${(error as Error).message || '未知错误'}`);
      throw error;
    }
  };

  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>{t('title')}</h1>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <label className='text-sm font-medium'>编辑模式:</label>
          <Select
            value={editMode}
            onValueChange={(value) => setEditMode(value as EditMode)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='immediate'>即时提交</SelectItem>
              <SelectItem value='single-row'>单行提交</SelectItem>
              <SelectItem value='batch'>批量提交</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editMode !== 'immediate' && (
          <p className='text-muted-foreground text-sm'>
            编辑后点击表格底部的提交按钮保存更改
          </p>
        )}
      </div>

      <DataGrid<DemoRow>
        id='maita-table-demo'
        columns={columns}
        dataSource={dataSource}
        initialViewState={{
          pageSize: 10000,
          // 默认将 ID 列固定在左侧，避免滚动时丢失
          columnsPinned: { id: 'left' }
        }}
        // 在列表头显示竖向分隔线，便于感知列边界和调整手柄
        showHeaderVerticalDividers
        editMode={editMode}
        onSubmit={editMode !== 'immediate' ? handleSubmit : undefined}
        onValidationError={(errors) => {
          const errorMessages = Object.values(errors);
          if (errorMessages.length > 0) {
            toast.error(
              `验证失败: ${errorMessages.slice(0, 3).join('; ')}${
                errorMessages.length > 3 ? '...' : ''
              }`,
              {
                id: 'maita-table-validation'
              }
            );
          }
        }}
        onSubmissionError={(error) => {
          toast.error(`提交失败: ${error.message || '未知错误'}`);
        }}
      />
    </div>
  );
}
