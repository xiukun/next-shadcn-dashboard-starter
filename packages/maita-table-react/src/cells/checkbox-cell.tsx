'use client';

import * as React from 'react';
import type { ColumnMeta } from '@maita-table/core';

export interface CheckboxCellProps {
  value: unknown;
  meta?: ColumnMeta<any, any>;
  error?: string | null;
  isModified?: boolean;
  onToggle: (next: boolean) => void;
}

export function CheckboxCell(props: CheckboxCellProps) {
  const { value, error, isModified = false, onToggle } = props;
  const checked = Boolean(value);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      onToggle(!checked);
    }
  };

  return (
    <td
      className={`mt-grid-td px-3 py-2 align-middle ${isModified ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
      title={error || (isModified ? '已修改，等待提交' : undefined)}
    >
      <div
        role='checkbox'
        aria-checked={checked}
        tabIndex={0}
        className={`inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded border text-[10px] ${checked ? 'bg-primary text-primary-foreground' : 'bg-background'} ${error ? 'border-destructive' : 'border-input'} `}
        onClick={() => onToggle(!checked)}
        onKeyDown={handleKeyDown}
      >
        {checked ? '✓' : null}
      </div>
    </td>
  );
}
