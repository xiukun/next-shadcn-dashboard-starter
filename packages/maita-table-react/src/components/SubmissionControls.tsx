'use client';

import * as React from 'react';
import { useTableSubmission } from '../hooks/useTableSubmission';
import type { ReactDataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';

export interface SubmissionControlsProps<Row> {
  store: ReactDataGridStore<Row>;
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  columns: ColumnConfig<Row>[];
  onValidationError?: (errors: Record<string, string>) => void;
  onSubmissionError?: (error: Error) => void;
}

export function SubmissionControls<Row>(props: SubmissionControlsProps<Row>) {
  const { store, onSubmit, columns, onValidationError, onSubmissionError } =
    props;
  const { submitBatch } = useTableSubmission({ store, columns, onSubmit });

  // 使用 React state 来响应 store 状态变化
  const [state, setState] = React.useState(() => store.getState());
  React.useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  const handleSubmitBatch = React.useCallback(async () => {
    try {
      await submitBatch();
    } catch (error) {
      // 错误已经在 submitBatch 内部处理
      if (onSubmissionError) {
        onSubmissionError(error as Error);
      }
    }
  }, [submitBatch, onSubmissionError]);

  // 监听验证错误
  React.useEffect(() => {
    const validationErrors = state.runtime.validationErrors;
    const rowValidationErrors = state.runtime.rowValidationErrors;

    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(rowValidationErrors).length > 0
    ) {
      const allErrors: Record<string, string> = { ...validationErrors };
      Object.entries(rowValidationErrors).forEach(([rowKey, errors]) => {
        errors.forEach((error, index) => {
          allErrors[`${rowKey}_${index}`] = error;
        });
      });

      if (onValidationError && Object.keys(allErrors).length > 0) {
        onValidationError(allErrors);
      }
    }
  }, [
    state.runtime.validationErrors,
    state.runtime.rowValidationErrors,
    onValidationError
  ]);

  const pendingCount = state.runtime.pendingEdits.length;
  const isSubmitting = state.runtime.submission.status === 'submitting';
  const submissionError =
    state.runtime.submission.failedRows?.[0]?.error || undefined;

  // 使用简单的 button 元素，避免依赖外部 UI 库
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        {pendingCount > 0 && (
          <span className='text-muted-foreground text-sm'>
            待提交: {pendingCount} 行
          </span>
        )}
        <button
          onClick={handleSubmitBatch}
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
      {submissionError && (
        <div className='text-destructive text-sm' role='alert'>
          提交失败: {submissionError}
        </div>
      )}
    </div>
  );
}
