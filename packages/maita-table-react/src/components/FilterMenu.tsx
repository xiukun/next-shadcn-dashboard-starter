'use client';

import * as React from 'react';
import type { FilterOperator } from '@maita-table/core';
import type { UseColumnFilteringResult } from '../hooks/useColumnFiltering';
import { cn } from '../utils';

export interface FilterMenuProps {
  /**
   * 列 ID
   */
  columnId: string;
  /**
   * 过滤器类型
   */
  filterType: 'text' | 'number' | 'date';
  /**
   * 过滤功能 Hook
   */
  filtering: UseColumnFilteringResult;
  /**
   * 当前过滤值
   */
  currentValue?: unknown;
  /**
   * 当前过滤操作符
   */
  currentOperator?: FilterOperator;
  /**
   * 关闭菜单回调
   */
  onClose?: () => void;
}

export function FilterMenu(props: FilterMenuProps) {
  const {
    columnId,
    filterType,
    filtering,
    currentValue,
    currentOperator,
    onClose
  } = props;

  const [operator, setOperator] = React.useState<FilterOperator>(
    currentOperator ||
      (filterType === 'text'
        ? 'contains'
        : filterType === 'number'
          ? 'gt'
          : 'eq')
  );
  const [value, setValue] = React.useState<string>(
    currentValue !== undefined && currentValue !== null
      ? String(currentValue)
      : ''
  );
  const [value2, setValue2] = React.useState<string>(''); // 用于 between 操作符

  React.useEffect(() => {
    if (currentValue !== undefined && currentValue !== null) {
      setValue(String(currentValue));
    }
  }, [currentValue]);

  React.useEffect(() => {
    if (currentOperator) {
      setOperator(currentOperator);
    }
  }, [currentOperator]);

  const handleApply = () => {
    if (operator === 'between') {
      if (value && value2) {
        filtering.setFilter(columnId, 'between', [value, value2]);
      }
    } else {
      if (value) {
        filtering.setFilter(
          columnId,
          operator,
          filterType === 'number' ? Number(value) : value
        );
      } else {
        filtering.clearFilter(columnId);
      }
    }
    onClose?.();
  };

  const handleClear = () => {
    filtering.clearFilter(columnId);
    setValue('');
    setValue2('');
    onClose?.();
  };

  // 文本过滤器操作符选项
  const textOperators: Array<{ value: FilterOperator; label: string }> = [
    { value: 'contains', label: '包含' },
    { value: 'startsWith', label: '开头是' },
    { value: 'endsWith', label: '结尾是' },
    { value: 'equals', label: '等于' },
    { value: 'ne', label: '不等于' }
  ];

  // 数字过滤器操作符选项
  const numberOperators: Array<{ value: FilterOperator; label: string }> = [
    { value: 'gt', label: '大于' },
    { value: 'gte', label: '大于等于' },
    { value: 'lt', label: '小于' },
    { value: 'lte', label: '小于等于' },
    { value: 'eq', label: '等于' },
    { value: 'ne', label: '不等于' },
    { value: 'between', label: '介于' }
  ];

  // 日期过滤器操作符选项
  const dateOperators: Array<{ value: FilterOperator; label: string }> = [
    { value: 'eq', label: '等于' },
    { value: 'ne', label: '不等于' },
    { value: 'gt', label: '晚于' },
    { value: 'gte', label: '不早于' },
    { value: 'lt', label: '早于' },
    { value: 'lte', label: '不晚于' },
    { value: 'between', label: '介于' }
  ];

  const operators =
    filterType === 'text'
      ? textOperators
      : filterType === 'number'
        ? numberOperators
        : dateOperators;

  const inputType =
    filterType === 'number'
      ? 'number'
      : filterType === 'date'
        ? 'date'
        : 'text';

  return (
    <div className='w-64 space-y-4 p-4'>
      {/* 操作符选择 */}
      <div className='space-y-2'>
        <label className='text-muted-foreground text-xs font-medium'>
          操作符
        </label>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as FilterOperator)}
          className='border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm'
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {/* 值输入 */}
      <div className='space-y-2'>
        <label className='text-muted-foreground text-xs font-medium'>
          {operator === 'between' ? '起始值' : '值'}
        </label>
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={operator === 'between' ? '起始值' : '输入值...'}
          className='border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm'
        />
      </div>

      {/* 第二个值输入（用于 between） */}
      {operator === 'between' && (
        <div className='space-y-2'>
          <label className='text-muted-foreground text-xs font-medium'>
            结束值
          </label>
          <input
            type={inputType}
            value={value2}
            onChange={(e) => setValue2(e.target.value)}
            placeholder='结束值...'
            className='border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm'
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div className='flex items-center justify-end gap-2 border-t pt-2'>
        <button
          type='button'
          onClick={handleClear}
          className='text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs transition-colors'
        >
          清除
        </button>
        <button
          type='button'
          onClick={handleApply}
          className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium transition-colors'
        >
          应用
        </button>
      </div>
    </div>
  );
}
