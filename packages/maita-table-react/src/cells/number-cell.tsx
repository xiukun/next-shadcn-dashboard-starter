'use client';

import * as React from 'react';
import type { ColumnMeta } from '@maita-table/core';

export interface NumberCellProps {
  value: unknown;
  draftValue?: unknown;
  meta?: ColumnMeta<any, any>;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeDraft: (next: string) => void;
  onCommit: (next: number | null) => void;
  onCancel: () => void;
}

function formatNumberDisplay(
  value: number | null | undefined,
  meta?: ColumnMeta<any, any>
) {
  if (value == null || Number.isNaN(value)) return '';

  const locale = meta?.locale ?? undefined;
  const useGrouping = meta?.thousandSeparator !== false;
  const decimals = typeof meta?.decimals === 'number' ? meta.decimals : undefined;
  const style = meta?.formatStyle ?? 'decimal';

  const options: Intl.NumberFormatOptions = {
    useGrouping
  };

  if (decimals != null) {
    options.minimumFractionDigits = decimals;
    options.maximumFractionDigits = decimals;
  }

  if (style === 'currency' && meta?.currency) {
    options.style = 'currency';
    options.currency = meta.currency;
  } else if (style === 'percent') {
    options.style = 'percent';
  } else {
    options.style = 'decimal';
  }

  return new Intl.NumberFormat(locale, options).format(value);
}

export function NumberCell(props: NumberCellProps) {
  const {
    value,
    draftValue,
    meta,
    isEditing,
    onStartEdit,
    onChangeDraft,
    onCommit,
    onCancel
  } = props;

  const numericValue =
    typeof value === 'number' && !Number.isNaN(value) ? (value as number) : null;

  const alignClass =
    meta?.align === 'right'
      ? 'text-right tabular-nums'
      : meta?.align === 'center'
      ? 'text-center'
      : 'text-left';

  const baseClasses = `mt-grid-td px-3 py-2 align-middle whitespace-nowrap ${alignClass}`;

  // 条件着色
  let colorClass = '';
  if (meta?.colorBySign && numericValue != null) {
    if (numericValue > 0) {
      colorClass = meta.positiveClassName ?? 'text-emerald-600';
    } else if (numericValue < 0) {
      colorClass = meta.negativeClassName ?? 'text-red-500';
    }
  }

  const effectiveDraft =
    draftValue == null ? String(value ?? '') : String(draftValue);

  const displayText = formatNumberDisplay(numericValue, meta);

  const parseToNumber = (raw: string): number | null => {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) return null;
    let n = parsed;

    if (meta?.allowNegative === false && n < 0) n = 0;
    if (typeof meta?.min === 'number') n = Math.max(meta.min, n);
    if (typeof meta?.max === 'number') n = Math.min(meta.max, n);
    if (typeof meta?.decimals === 'number') {
      const factor = 10 ** meta.decimals;
      n = Math.round(n * factor) / factor;
    }
    return n;
  };

  const applyStep = (direction: 1 | -1) => {
    if (meta?.editorType !== 'number') return;
    const step = typeof meta.step === 'number' ? meta.step : 1;
    const base = Number(effectiveDraft);
    if (Number.isNaN(base)) return;
    const next = base + direction * step;
    onChangeDraft(String(next));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      applyStep(1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      applyStep(-1);
      return;
    }
    if (event.key === 'Enter') {
      const n = parseToNumber(effectiveDraft);
      onCommit(n);
      return;
    }
    if (event.key === 'Escape') {
      onCancel();
    }
  };

  if (!isEditing) {
    return (
      <td
        className={`${baseClasses} ${colorClass}`}
        onClick={onStartEdit}
        onDoubleClick={onStartEdit}
      >
        {displayText}
      </td>
    );
  }

  return (
    <td className={baseClasses}>
      <input
        className='h-7 w-24 rounded border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
        autoFocus
        value={effectiveDraft}
        onChange={(e) => onChangeDraft(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </td>
  );
}

