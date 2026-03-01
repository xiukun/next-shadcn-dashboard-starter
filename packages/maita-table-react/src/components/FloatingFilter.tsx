'use client';

import * as React from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../utils';

export type FilterOperator =
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between';

export interface FloatingFilterProps {
  /**
   * 列 ID
   */
  columnId: string;
  /**
   * 过滤器类型
   */
  filterType: 'text' | 'number' | 'date';
  /**
   * 占位符文本
   */
  placeholder?: string;
  /**
   * 当前过滤值
   */
  value?: string;
  /**
   * 值变化回调（已防抖）
   */
  onValueChange: (value: string) => void;
  /**
   * 自定义 className
   */
  className?: string;
}

export function FloatingFilter(props: FloatingFilterProps) {
  const {
    columnId,
    filterType,
    placeholder,
    value: controlledValue,
    onValueChange,
    className
  } = props;

  const [localValue, setLocalValue] = React.useState(controlledValue || '');

  React.useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== localValue) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // 防抖处理：300ms 后触发 onValueChange
  const debouncedValue = useDebounce(localValue, 300);

  React.useEffect(() => {
    // 只有当防抖后的值与当前值不同时才触发更新
    if (debouncedValue !== controlledValue) {
      onValueChange(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const inputType =
    filterType === 'number'
      ? 'number'
      : filterType === 'date'
        ? 'date'
        : 'text';

  return (
    <div
      className={cn(
        'border-border bg-background flex items-center border-b px-3 py-1.5',
        className
      )}
    >
      <input
        type={inputType}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || '过滤...'}
        className='text-foreground placeholder:text-muted-foreground w-full bg-transparent text-xs outline-none'
        aria-label={`过滤 ${columnId}`}
      />
    </div>
  );
}
