'use client';

import { useState } from 'react';
import { DataGrid, type EditMode } from '@maita-table/react';
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

export default function Page() {
  const t = useTranslations('maita-table-demo');
  const [editMode, setEditMode] = useState<EditMode>('immediate');

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
        initialViewState={{ pageSize: 10000 }}
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
