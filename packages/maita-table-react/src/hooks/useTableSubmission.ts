import { useCallback } from 'react';
import type { DataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';
import { createRowSchema } from '@maita-table/core';

export interface UseTableSubmissionOptions<Row> {
  store: DataGridStore<Row>;
  columns: ColumnConfig<Row>[];
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  validateRow?: (
    row: Row
  ) => Promise<{ success: boolean; errors?: Record<string, string> }>;
}

export function useTableSubmission<Row>(
  options: UseTableSubmissionOptions<Row>
) {
  const { store, columns, onSubmit, validateRow } = options;
  const rowSchema = createRowSchema(columns);
  const validateSingleRow = useCallback(
    async (
      rowKey: string,
      editedRow: Partial<Row>,
      originalRow: Row
    ): Promise<{ success: boolean; errors?: Record<string, string> }> => {
      // 转换数据类型以匹配 schema
      // 对于有 trueValue/falseValue 的 boolean 列，需要将字符串值转换回 boolean
      const normalizedEditedRow: Partial<Row> = { ...editedRow };
      columns.forEach((col) => {
        const meta = col.meta;
        if (
          meta?.type === 'boolean' &&
          meta.editable &&
          (meta as any).trueValue !== undefined &&
          (meta as any).falseValue !== undefined &&
          Object.prototype.hasOwnProperty.call(normalizedEditedRow, col.id)
        ) {
          const value = (normalizedEditedRow as any)[col.id];
          // 如果值是字符串（trueValue/falseValue），转换为 boolean
          if (typeof value === 'string') {
            (normalizedEditedRow as any)[col.id] =
              value === (meta as any).trueValue;
          }
        }
      });

      const mergedRow = { ...originalRow, ...normalizedEditedRow };

      // Zod 验证
      const zodResult = rowSchema.safeParse(mergedRow);
      if (!zodResult.success) {
        const errors: Record<string, string> = {};
        zodResult.error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as string;
            const column = columns.find((c) => c.id === fieldName);
            const fieldLabel = column?.header || fieldName;
            errors[fieldName] = `${fieldLabel}: ${err.message}`;
          }
        });
        return { success: false, errors };
      }

      // 自定义验证
      if (validateRow) {
        const customResult = await validateRow(mergedRow);
        if (!customResult.success) {
          return customResult;
        }
      }

      return { success: true };
    },
    [rowSchema, validateRow]
  );

  const submitRow = useCallback(
    async (rowKey: string) => {
      const state = store.getState();
      const pendingEdit = state.runtime.pendingEdits.find(
        (e) => e.rowKey === rowKey
      );

      if (!pendingEdit) return;

      // 验证
      const validation = await validateSingleRow(
        rowKey,
        pendingEdit.editedRow,
        pendingEdit.originalRow
      );

      if (!validation.success) {
        // 设置验证错误
        const storeState = store.getState();
        if (validation.errors) {
          Object.entries(validation.errors).forEach(([key, error]) => {
            storeState.setValidationError(key, error);
          });
        }
        storeState.setRowValidationErrors(
          rowKey,
          validation.errors ? Object.values(validation.errors) : []
        );
        return;
      }

      // 开始提交
      store.getState().startSubmission([rowKey]);

      try {
        // 转换数据类型以匹配 schema
        const normalizedEditedRow: Partial<Row> = {
          ...pendingEdit.editedRow
        };
        columns.forEach((col) => {
          const meta = col.meta;
          if (
            meta?.type === 'boolean' &&
            meta.editable &&
            (meta as any).trueValue !== undefined &&
            (meta as any).falseValue !== undefined &&
            Object.prototype.hasOwnProperty.call(normalizedEditedRow, col.id)
          ) {
            const value = (normalizedEditedRow as any)[col.id];
            // 如果值是字符串（trueValue/falseValue），转换为 boolean
            if (typeof value === 'string') {
              (normalizedEditedRow as any)[col.id] =
                value === (meta as any).trueValue;
            }
          }
        });

        const mergedRow = {
          ...pendingEdit.originalRow,
          ...normalizedEditedRow
        } as Row;

        await onSubmit([{ rowKey, row: mergedRow }]);

        // 提交成功
        store.getState().completeSubmission([rowKey]);

        // 从队列移除
        store.getState().removeFromQueue(rowKey);
      } catch (error) {
        store
          .getState()
          .failSubmission(
            [rowKey],
            [{ rowKey, error: (error as Error).message }]
          );
      }
    },
    [store, validateSingleRow, onSubmit]
  );

  const submitBatch = useCallback(
    async (rowKeys?: string[]) => {
      const state = store.getState();
      const editsToSubmit = rowKeys
        ? state.runtime.pendingEdits.filter((e) => rowKeys.includes(e.rowKey))
        : state.runtime.pendingEdits;

      if (editsToSubmit.length === 0) return;

      // 批量验证
      const validations = await Promise.all(
        editsToSubmit.map((edit) =>
          validateSingleRow(edit.rowKey, edit.editedRow, edit.originalRow)
        )
      );

      // 收集验证错误
      const allErrors: Record<string, string> = {};
      const rowErrors: Record<string, string[]> = {};

      validations.forEach((validation, index) => {
        if (!validation.success) {
          const edit = editsToSubmit[index];
          Object.assign(allErrors, validation.errors || {});
          if (validation.errors) {
            rowErrors[edit.rowKey] = Object.values(validation.errors);
          }
        }
      });

      // 如果有验证错误，停止提交并抛出错误
      if (
        Object.keys(allErrors).length > 0 ||
        Object.keys(rowErrors).length > 0
      ) {
        const storeState = store.getState();
        Object.entries(allErrors).forEach(([key, error]) => {
          storeState.setValidationError(key, error);
        });
        Object.entries(rowErrors).forEach(([rowKey, errors]) => {
          storeState.setRowValidationErrors(rowKey, errors);
        });
        // 抛出验证错误，让调用者可以处理
        const errorMessages = Object.values(allErrors);
        if (errorMessages.length > 0) {
          throw new Error(
            `验证失败: ${errorMessages.slice(0, 3).join('; ')}${
              errorMessages.length > 3 ? '...' : ''
            }`
          );
        }
        return;
      }

      // 开始提交
      const keysToSubmit = editsToSubmit.map((e) => e.rowKey);
      store.getState().startSubmission(keysToSubmit);

      try {
        // 转换数据类型以匹配 schema
        const submitData = editsToSubmit.map((edit) => {
          const normalizedEditedRow: Partial<Row> = { ...edit.editedRow };
          columns.forEach((col) => {
            const meta = col.meta;
            if (
              meta?.type === 'boolean' &&
              meta.editable &&
              (meta as any).trueValue !== undefined &&
              (meta as any).falseValue !== undefined &&
              Object.prototype.hasOwnProperty.call(normalizedEditedRow, col.id)
            ) {
              const value = (normalizedEditedRow as any)[col.id];
              // 如果值是字符串（trueValue/falseValue），转换为 boolean
              if (typeof value === 'string') {
                (normalizedEditedRow as any)[col.id] =
                  value === (meta as any).trueValue;
              }
            }
          });
          return {
            rowKey: edit.rowKey,
            row: { ...edit.originalRow, ...normalizedEditedRow } as Row
          };
        });

        await onSubmit(submitData);

        // 提交成功
        store.getState().completeSubmission(keysToSubmit);

        // 从队列移除
        const storeState = store.getState();
        keysToSubmit.forEach((rowKey) => {
          storeState.removeFromQueue(rowKey);
        });
      } catch (error) {
        store.getState().failSubmission(
          keysToSubmit,
          keysToSubmit.map((rowKey) => ({
            rowKey,
            error: (error as Error).message
          }))
        );
      }
    },
    [store, validateSingleRow, onSubmit]
  );

  return {
    submitRow,
    submitBatch,
    validateSingleRow
  };
}
