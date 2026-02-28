'use client';

import * as React from 'react';
import { useTableSubmission } from '../hooks/useTableSubmission';
import type { ReactDataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';

export interface SubmissionControlsProps<Row> {
  store: ReactDataGridStore<Row>;
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  columns: ColumnConfig<Row>[];
}

export function SubmissionControls<Row>(props: SubmissionControlsProps<Row>) {
  const { store, onSubmit, columns } = props;
  const state = store.getState();
  const { submitBatch } = useTableSubmission({ store, columns, onSubmit });

  const pendingCount = state.runtime.pendingEdits.length;
  const isSubmitting = state.runtime.submission.status === 'submitting';

  // 使用简单的 button 元素，避免依赖外部 UI 库
  return (
    <div className='flex items-center gap-2'>
      {pendingCount > 0 && (
        <span className='text-muted-foreground text-sm'>
          待提交: {pendingCount} 行
        </span>
      )}
      <button
        onClick={() => submitBatch()}
        disabled={pendingCount === 0 || isSubmitting}
        className='bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50'
        aria-label='提交全部'
      >
        {isSubmitting ? '提交中...' : `提交全部 (${pendingCount})`}
      </button>
      {pendingCount > 0 && (
        <button
          onClick={() => {
            // 清空所有待提交的编辑
            state.runtime.pendingEdits.forEach((edit) => {
              store.dispatch({
                type: 'edit/removeFromQueue',
                rowKey: edit.rowKey
              });
            });
            store.dispatch({ type: 'submission/reset' });
          }}
          className='hover:bg-accent rounded-md border px-4 py-2'
          aria-label='取消'
        >
          取消
        </button>
      )}
    </div>
  );
}
