# 企业级大数据表格编辑提交与验证最佳实践讨论

## 背景

当前 `@maita-table` 已实现基础的单元格编辑功能，但在企业级场景下需要支持：
- **单行提交**：编辑一行后统一提交
- **多行批量提交**：选择多行进行批量编辑和提交
- **结构化验证**：使用 Zod 进行类型安全的验证
- **状态解耦**：编辑状态与业务逻辑分离
- **性能优化**：大数据量下的高效处理

## 当前实现分析

### 现状

1. **编辑模式**：单元格级别编辑，每次编辑立即更新本地状态
2. **验证方式**：简单的 `validate` 函数，返回错误字符串
3. **提交机制**：编辑即提交，没有待提交队列
4. **状态管理**：编辑状态在 Zustand store 中，但逻辑耦合在组件中

### 存在的问题

1. ❌ **无法批量提交**：每次单元格编辑都立即提交，无法撤销
2. ❌ **验证不够结构化**：简单的字符串验证，无法复用和组合
3. ❌ **状态耦合**：编辑逻辑与 UI 组件耦合，难以测试和复用
4. ❌ **性能问题**：大数据量下频繁的状态更新可能导致性能问题
5. ❌ **缺少事务性**：无法保证多行编辑的原子性

## 方案设计

### 1. 引入 Zod 进行结构化验证

#### 1.1 设计思路

使用 Zod Schema 定义每列的验证规则，支持：
- 类型验证（string, number, date 等）
- 范围验证（min, max）
- 自定义验证规则
- 跨列验证（行级验证）

#### 1.2 实现方案

```typescript
// packages/maita-table-core/src/validation.ts

import { z } from 'zod';
import type { ColumnConfig, ColumnMeta } from './column';

// 列级验证 Schema 生成器
export function createColumnSchema<Row, Value>(
  column: ColumnConfig<Row, Value>,
  meta?: ColumnMeta<Row, Value>
): z.ZodType<Value> {
  let schema: z.ZodType<Value>;

  // 基础类型
  switch (meta?.type) {
    case 'number':
    case 'integer':
      schema = z.number() as z.ZodType<Value>;
      if (meta?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(meta.min);
      }
      if (meta?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(meta.max);
      }
      if (meta?.type === 'integer') {
        schema = (schema as z.ZodNumber).int();
      }
      break;
    case 'string':
      schema = z.string() as z.ZodType<Value>;
      break;
    case 'boolean':
      schema = z.boolean() as z.ZodType<Value>;
      break;
    case 'date':
    case 'datetime':
      schema = z.date() as z.ZodType<Value>;
      break;
    default:
      schema = z.unknown() as z.ZodType<Value>;
  }

  // 必填验证
  if (meta?.required) {
    schema = schema as z.ZodType<Value>;
  } else {
    schema = schema.optional() as z.ZodType<Value>;
  }

  // 自定义验证
  if (meta?.validate) {
    schema = schema.refine(
      (val) => {
        const result = meta.validate!(val, {} as Row);
        return result === null || result === undefined;
      },
      { message: meta.validate as any }
    ) as z.ZodType<Value>;
  }

  return schema;
}

// 行级验证 Schema 生成器
export function createRowSchema<Row>(
  columns: ColumnConfig<Row>[]
): z.ZodType<Row> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const col of columns) {
    if (col.meta?.editable) {
      shape[col.id] = createColumnSchema(col, col.meta);
    }
  }

  return z.object(shape) as z.ZodType<Row>;
}

// 验证结果类型
export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string>; // columnId -> error message
  rowErrors?: string[]; // 行级错误（跨列验证）
}
```

#### 1.3 使用示例

```typescript
// 定义列配置
const columns: ColumnConfig<Product>[] = [
  {
    id: 'price',
    header: '价格',
    accessor: (row) => row.price,
    meta: {
      type: 'number',
      min: 0,
      max: 10000,
      decimals: 2,
      required: true
    }
  },
  {
    id: 'name',
    header: '名称',
    accessor: (row) => row.name,
    meta: {
      type: 'string',
      required: true,
      validate: (val) => {
        if (val.length < 3) return '名称至少3个字符';
        return null;
      }
    }
  }
];

// 生成验证 Schema
const rowSchema = createRowSchema(columns);

// 验证单行
const result = rowSchema.safeParse(editedRow);
if (!result.success) {
  // 处理验证错误
  const errors = result.error.flatten().fieldErrors;
}
```

### 2. 状态解耦设计

#### 2.1 编辑状态分离

将编辑状态分为三层：
1. **UI 状态**：当前编辑的单元格、草稿值（在组件中）
2. **编辑队列**：待提交的编辑记录（在 store 中）
3. **提交状态**：提交中、成功、失败（在 store 中）

#### 2.2 状态结构设计

```typescript
// packages/maita-table-core/src/state.ts

export interface EditingCell {
  rowKey: string;
  columnId: string;
}

export interface PendingEdit<Row = any> {
  rowKey: string;
  rowIndex: number;
  originalRow: Row;
  editedRow: Partial<Row>; // 只包含被编辑的字段
  timestamp: number;
}

export interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  submittedRows: string[]; // rowKeys
  failedRows: Array<{
    rowKey: string;
    error: string;
  }>;
}

export interface DataGridRuntimeState<Row = any> {
  // 当前编辑状态（UI 层）
  editingCell?: EditingCell;
  editingDraftValues: Record<string, unknown>; // cellKey -> draftValue
  
  // 编辑队列（待提交）
  pendingEdits: PendingEdit<Row>[];
  
  // 提交状态
  submission: SubmissionState;
  
  // 验证错误
  validationErrors: Record<string, string>; // cellKey -> error message
  rowValidationErrors: Record<string, string[]>; // rowKey -> errors
}
```

#### 2.3 事件扩展

```typescript
// packages/maita-table-core/src/controller.ts

export type DataGridInternalEvent<Row = any> =
  // ... 现有事件
  | {
      type: 'edit/queue'; // 将编辑加入队列（不立即提交）
      cell: EditingCell;
      value: unknown;
    }
  | {
      type: 'edit/queueRow'; // 将整行编辑加入队列
      rowKey: string;
      editedRow: Partial<Row>;
    }
  | {
      type: 'edit/removeFromQueue'; // 从队列移除
      rowKey: string;
    }
  | {
      type: 'submission/start'; // 开始提交
      rowKeys?: string[]; // 如果指定，只提交这些行
    }
  | {
      type: 'submission/success';
      rowKeys: string[];
    }
  | {
      type: 'submission/error';
      rowKeys: string[];
      errors: Array<{ rowKey: string; error: string }>;
    }
  | {
      type: 'submission/reset';
    };
```

### 3. 提交机制设计

#### 3.1 提交策略

支持三种提交模式：

1. **即时提交**（当前模式）：编辑即提交
2. **单行提交**：编辑一行后，点击"提交"按钮提交该行
3. **批量提交**：编辑多行后，统一提交所有待提交的行

#### 3.2 提交流程

```typescript
// packages/maita-table-react/src/hooks/useTableSubmission.ts

import { useCallback } from 'react';
import { z } from 'zod';
import type { ReactDataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';
import { createRowSchema, type ValidationResult } from '@maita-table/core';

export interface UseTableSubmissionOptions<Row> {
  store: ReactDataGridStore<Row>;
  columns: ColumnConfig<Row>[];
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  validateRow?: (row: Row) => Promise<ValidationResult>;
}

export function useTableSubmission<Row>(options: UseTableSubmissionOptions<Row>) {
  const { store, columns, onSubmit, validateRow } = options;
  
  const rowSchema = createRowSchema(columns);
  
  // 验证单行
  const validateSingleRow = useCallback(async (
    rowKey: string,
    editedRow: Partial<Row>,
    originalRow: Row
  ): Promise<ValidationResult> => {
    // 合并原始行和编辑内容
    const mergedRow = { ...originalRow, ...editedRow };
    
    // Zod 验证
    const zodResult = rowSchema.safeParse(mergedRow);
    if (!zodResult.success) {
      const errors: Record<string, string> = {};
      zodResult.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0] as string] = err.message;
        }
      });
      return { success: false, errors };
    }
    
    // 自定义行级验证
    if (validateRow) {
      const customResult = await validateRow(mergedRow);
      if (!customResult.success) {
        return customResult;
      }
    }
    
    return { success: true };
  }, [rowSchema, validateRow]);
  
  // 提交单行
  const submitRow = useCallback(async (rowKey: string) => {
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
      store.dispatch({
        type: 'runtime/patch',
        patch: {
          validationErrors: validation.errors || {},
          rowValidationErrors: {
            ...state.runtime.rowValidationErrors,
            [rowKey]: validation.rowErrors || []
          }
        }
      });
      return;
    }
    
    // 开始提交
    store.dispatch({
      type: 'submission/start',
      rowKeys: [rowKey]
    });
    
    try {
      const mergedRow = {
        ...pendingEdit.originalRow,
        ...pendingEdit.editedRow
      } as Row;
      
      await onSubmit([{ rowKey, row: mergedRow }]);
      
      // 提交成功
      store.dispatch({
        type: 'submission/success',
        rowKeys: [rowKey]
      });
      
      // 从队列移除
      store.dispatch({
        type: 'edit/removeFromQueue',
        rowKey
      });
      
      // 刷新数据
      // ... 触发数据刷新
    } catch (error) {
      store.dispatch({
        type: 'submission/error',
        rowKeys: [rowKey],
        errors: [{ rowKey, error: error.message }]
      });
    }
  }, [store, validateSingleRow, onSubmit]);
  
  // 批量提交
  const submitBatch = useCallback(async (rowKeys?: string[]) => {
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
        if (validation.rowErrors) {
          rowErrors[edit.rowKey] = validation.rowErrors;
        }
      }
    });
    
    // 如果有验证错误，停止提交
    if (Object.keys(allErrors).length > 0 || Object.keys(rowErrors).length > 0) {
      store.dispatch({
        type: 'runtime/patch',
        patch: {
          validationErrors: allErrors,
          rowValidationErrors: rowErrors
        }
      });
      return;
    }
    
    // 开始提交
    const keysToSubmit = editsToSubmit.map((e) => e.rowKey);
    store.dispatch({
      type: 'submission/start',
      rowKeys: keysToSubmit
    });
    
    try {
      const submitData = editsToSubmit.map((edit) => ({
        rowKey: edit.rowKey,
        row: { ...edit.originalRow, ...edit.editedRow } as Row
      }));
      
      await onSubmit(submitData);
      
      // 提交成功
      store.dispatch({
        type: 'submission/success',
        rowKeys: keysToSubmit
      });
      
      // 从队列移除
      keysToSubmit.forEach((rowKey) => {
        store.dispatch({
          type: 'edit/removeFromQueue',
          rowKey
        });
      });
      
      // 刷新数据
      // ... 触发数据刷新
    } catch (error) {
      store.dispatch({
        type: 'submission/error',
        rowKeys: keysToSubmit,
        errors: keysToSubmit.map((rowKey) => ({
          rowKey,
          error: error.message
        }))
      });
    }
  }, [store, validateSingleRow, onSubmit]);
  
  return {
    submitRow,
    submitBatch,
    validateSingleRow
  };
}
```

### 4. 性能优化策略

#### 4.1 防抖和节流

```typescript
// 编辑草稿值更新使用防抖
const debouncedUpdateDraft = useMemo(
  () => debounce((cellKey: string, value: unknown) => {
    store.dispatch({
      type: 'edit/change',
      cell: parseCellKey(cellKey),
      value
    });
  }, 150),
  [store]
);

// 验证使用节流
const throttledValidate = useMemo(
  () => throttle(async (cellKey: string, value: unknown) => {
    // 执行验证
  }, 300),
  []
);
```

#### 4.2 批量状态更新

```typescript
// 使用 React 18 的自动批处理
// 或者手动批处理多个状态更新
const batchUpdate = (updates: Array<() => void>) => {
  React.startTransition(() => {
    updates.forEach((update) => update());
  });
};
```

#### 4.3 虚拟化优化

```typescript
// 只验证可见行的编辑
const validateVisibleRows = useCallback(() => {
  const visibleRowKeys = virtualItems.map((item) => rows[item.index].id);
  // 只验证可见行的编辑
}, [virtualItems, rows]);
```

#### 4.4 提交队列优化

```typescript
// 限制队列大小，避免内存问题
const MAX_PENDING_EDITS = 1000;

const addToQueue = (edit: PendingEdit) => {
  if (pendingEdits.length >= MAX_PENDING_EDITS) {
    // 移除最旧的编辑
    pendingEdits.shift();
  }
  pendingEdits.push(edit);
};
```

### 5. UI 组件设计

#### 5.1 编辑模式切换

```typescript
// 支持三种编辑模式
type EditMode = 'immediate' | 'single-row' | 'batch';

interface DataGridProps {
  editMode?: EditMode;
  // ...
}
```

#### 5.2 提交按钮组件

```typescript
// packages/maita-table-react/src/components/SubmissionControls.tsx

export function SubmissionControls<Row>(props: {
  store: ReactDataGridStore<Row>;
  onSubmit: UseTableSubmissionOptions<Row>['onSubmit'];
  columns: ColumnConfig<Row>[];
}) {
  const { store, onSubmit, columns } = props;
  const state = store.getState();
  const { submitRow, submitBatch } = useTableSubmission({
    store,
    columns,
    onSubmit
  });
  
  const pendingCount = state.runtime.pendingEdits.length;
  const isSubmitting = state.runtime.submission.status === 'submitting';
  
  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <span className="text-sm text-muted-foreground">
          待提交: {pendingCount} 行
        </span>
      )}
      <Button
        onClick={() => submitBatch()}
        disabled={pendingCount === 0 || isSubmitting}
      >
        {isSubmitting ? '提交中...' : `提交全部 (${pendingCount})`}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          // 清空队列
          store.dispatch({ type: 'submission/reset' });
        }}
        disabled={pendingCount === 0}
      >
        取消
      </Button>
    </div>
  );
}
```

#### 5.3 行级编辑指示器

```typescript
// 在表格行中显示编辑状态
<tr className={cn(
  "mt-grid-tr",
  isPending && "bg-yellow-50 dark:bg-yellow-950/20",
  isSubmitting && "opacity-50",
  hasError && "bg-red-50 dark:bg-red-950/20"
)}>
  {/* 行内容 */}
  {isPending && (
    <td>
      <Button size="sm" onClick={() => submitRow(rowKey)}>
        提交
      </Button>
    </td>
  )}
</tr>
```

## 实施建议

### 阶段 1: 引入 Zod 验证（优先级：高）

1. 安装 `zod` 依赖
2. 实现 `createColumnSchema` 和 `createRowSchema`
3. 替换现有的 `validate` 函数为 Zod Schema
4. 保持向后兼容（支持旧的 validate 函数）

### 阶段 2: 状态解耦（优先级：高）

1. 扩展 `DataGridRuntimeState` 添加编辑队列和提交状态
2. 实现新的事件类型（`edit/queue`, `submission/*`）
3. 更新控制器处理新事件
4. 迁移现有编辑逻辑到新架构

### 阶段 3: 提交机制（优先级：中）

1. 实现 `useTableSubmission` Hook
2. 添加 `SubmissionControls` 组件
3. 支持三种编辑模式切换
4. 实现批量提交逻辑

### 阶段 4: 性能优化（优先级：中）

1. 添加防抖和节流
2. 优化批量状态更新
3. 限制队列大小
4. 添加性能监控

## 总结

### 核心优势

1. ✅ **类型安全**：Zod Schema 提供编译时和运行时类型检查
2. ✅ **状态解耦**：编辑状态与 UI 分离，易于测试和复用
3. ✅ **灵活提交**：支持即时、单行、批量三种提交模式
4. ✅ **性能优化**：防抖、节流、批量更新等优化策略
5. ✅ **可扩展性**：易于添加新的验证规则和提交策略

### 关键决策点

1. **是否完全替换现有 validate 函数？**
   - 建议：保持向后兼容，同时支持 Zod Schema 和旧的 validate 函数

2. **编辑队列的存储位置？**
   - 建议：存储在 Zustand store 中，支持持久化（可选）

3. **批量提交的原子性？**
   - 建议：前端批量提交，后端支持事务（如果可能）

4. **性能优化的时机？**
   - 建议：先实现功能，再根据实际性能数据优化

## 下一步行动

1. 讨论并确认方案设计
2. 创建实现计划文档
3. 分阶段实施
4. 编写测试用例
5. 更新文档和示例
