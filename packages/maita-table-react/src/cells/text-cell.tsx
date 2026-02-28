'use client';

import * as React from 'react';
import type { ColumnMeta } from '@maita-table/core';

export interface TextCellProps {
  value: unknown;
  draftValue?: unknown;
  meta?: ColumnMeta<any, any>;
  isEditing: boolean;
  error?: string | null;
  isModified?: boolean;
  onStartEdit: () => void;
  onChangeDraft: (next: string) => void;
  onCommit: (next: string | null) => void;
  onCancel: () => void;
  onMoveFocus?: (direction: 'next' | 'prev') => void;
  style?: React.CSSProperties;
}

export function TextCell(props: TextCellProps) {
  const {
    value,
    draftValue,
    meta,
    isEditing,
    error,
    isModified = false,
    onStartEdit,
    onChangeDraft,
    onCommit,
    onCancel,
    onMoveFocus,
    style
  } = props;

  const alignClass =
    meta?.align === 'right'
      ? 'text-right'
      : meta?.align === 'center'
        ? 'text-center'
        : 'text-left';

  const baseClasses = `mt-grid-td px-3 py-2 align-middle whitespace-nowrap ${alignClass}`;
  const errorClasses = error ? 'border-destructive text-destructive' : '';
  const modifiedClasses =
    isModified && !isEditing ? 'bg-blue-100 dark:bg-blue-900/30' : '';

  // 在非编辑状态下，优先使用 value（可能包含待提交的修改值）
  // 在编辑状态下，优先使用 draftValue（当前正在编辑的值）
  const effectiveDraft = isEditing
    ? draftValue == null
      ? String(value ?? '')
      : String(draftValue ?? '')
    : String(value ?? '');

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
        className={`${baseClasses} ${error ? 'text-destructive' : ''} ${modifiedClasses}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        title={error || (isModified ? '已修改，等待提交' : undefined)}
      >
        {effectiveDraft}
      </td>
    );
  }

  const maxLength =
    typeof meta?.maxLength === 'number' ? meta.maxLength : undefined;

  return (
    <td className={baseClasses} style={style}>
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
