'use client';

import * as React from 'react';
import type { ColumnMeta } from '@maita-table/core';

export interface TextCellProps {
  value: unknown;
  draftValue?: unknown;
  meta?: ColumnMeta<any, any>;
  isEditing: boolean;
  error?: string;
  onStartEdit: () => void;
  onChangeDraft: (next: string) => void;
  onCommit: (next: string | null) => void;
  onCancel: () => void;
  onMoveFocus?: (direction: 'next' | 'prev') => void;
}

export function TextCell(props: TextCellProps) {
  const {
    value,
    draftValue,
    meta,
    isEditing,
    error,
    onStartEdit,
    onChangeDraft,
    onCommit,
    onCancel,
    onMoveFocus
  } = props;

  const alignClass =
    meta?.align === 'right'
      ? 'text-right'
      : meta?.align === 'center'
        ? 'text-center'
        : 'text-left';

  const baseClasses = `mt-grid-td px-3 py-2 align-middle whitespace-nowrap ${alignClass}`;
  const errorClasses = error ? 'border-destructive text-destructive' : '';

  const effectiveDraft =
    draftValue == null ? String(value ?? '') : String(draftValue ?? '');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      onCancel();
      if (onMoveFocus) {
        onMoveFocus(event.shiftKey ? 'prev' : 'next');
      }
      return;
    }

    if (event.key === 'Enter') {
      onCommit(effectiveDraft || null);
      return;
    }
    if (event.key === 'Escape') {
      onCancel();
      return;
    }
  };

  if (!isEditing) {
    return (
      <td
        className={`${baseClasses} ${error ? 'text-destructive' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        title={error}
      >
        {effectiveDraft}
      </td>
    );
  }

  const maxLength =
    typeof meta?.maxLength === 'number' ? meta.maxLength : undefined;

  return (
    <td className={baseClasses}>
      <input
        className={`bg-background focus-visible:ring-ring h-7 w-64 max-w-full rounded border px-2 text-sm outline-none focus-visible:ring-2 ${
          errorClasses || 'border-input'
        }`}
        autoFocus
        value={effectiveDraft}
        maxLength={maxLength}
        placeholder={meta?.placeholder as string | undefined}
        onChange={(e) => onChangeDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        title={error}
      />
    </td>
  );
}
