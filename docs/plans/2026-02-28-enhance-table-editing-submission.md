# 增强表格编辑提交与验证能力实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强 `@maita-table` 的编辑提交与验证能力，支持 Zod 验证、灵活的提交模式（即时/单行/批量）、状态解耦和性能优化。

**Architecture:** 
- 在 `@maita-table/core` 中新增验证模块，支持 Zod Schema
- 扩展状态管理，添加编辑队列和提交状态
- 在 `@maita-table/react` 中实现提交 Hook 和组件
- 充分利用 TanStack Table 的优势（状态管理、虚拟化）

**Tech Stack:** 
- TypeScript 5.7
- Zod (新增依赖)
- TanStack Table (已存在)
- Zustand (已存在)
- React 19
- Vitest (测试)

---

## 阶段 1：Zod 验证集成

### Task 1.1: 安装 Zod 依赖

**Files:**
- Modify: `packages/maita-table-core/package.json`

**Step 1: 添加依赖**

```bash
cd packages/maita-table-core
pnpm add zod
```

**Step 2: 验证安装**

Run: `pnpm list zod`
Expected: 显示 zod 版本信息

**Step 3: Commit**

```bash
git add packages/maita-table-core/package.json packages/maita-table-core/pnpm-lock.yaml
git commit -m "feat(core): add zod dependency for validation"
```

---

### Task 1.2: 创建验证模块基础结构

**Files:**
- Create: `packages/maita-table-core/src/validation.ts`
- Create: `packages/maita-table-core/tests/validation.test.ts`

**Step 1: 编写失败的测试**

```typescript
// packages/maita-table-core/tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import { createColumnSchema, createRowSchema } from '../src/validation';
import type { ColumnConfig, ColumnMeta } from '../src/column';

describe('validation', () => {
  describe('createColumnSchema', () => {
    it('should create number schema with min/max', () => {
      const column: ColumnConfig<any, number> = {
        id: 'price',
        header: 'Price',
        accessor: (row) => row.price,
        meta: {
          type: 'number',
          min: 0,
          max: 1000
        }
      };
      
      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(2000)).toThrow();
    });
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: FAIL with "createColumnSchema is not defined"

**Step 3: 实现最小代码**

```typescript
// packages/maita-table-core/src/validation.ts
import { z } from 'zod';
import type { ColumnConfig, ColumnMeta } from './column';

export function createColumnSchema<Row, Value>(
  column: ColumnConfig<Row, Value>,
  meta?: ColumnMeta<Row, Value>
): z.ZodType<Value> {
  // TODO: 实现
  return z.unknown() as z.ZodType<Value>;
}
```

**Step 4: 运行测试确认通过**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: 测试通过（或至少不报"未定义"错误）

**Step 5: Commit**

```bash
git add packages/maita-table-core/src/validation.ts packages/maita-table-core/tests/validation.test.ts
git commit -m "test(core): add validation module tests"
```

---

### Task 1.3: 实现 createColumnSchema 函数

**Files:**
- Modify: `packages/maita-table-core/src/validation.ts`
- Modify: `packages/maita-table-core/tests/validation.test.ts`

**Step 1: 扩展测试用例**

```typescript
// packages/maita-table-core/tests/validation.test.ts
describe('createColumnSchema', () => {
  it('should create number schema with min/max', () => { /* ... */ });
  
  it('should create string schema', () => {
    const column: ColumnConfig<any, string> = {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      meta: { type: 'string', required: true }
    };
    
    const schema = createColumnSchema(column, column.meta);
    expect(schema.parse('test')).toBe('test');
    expect(() => schema.parse(undefined)).toThrow();
  });
  
  it('should create boolean schema', () => {
    const column: ColumnConfig<any, boolean> = {
      id: 'active',
      header: 'Active',
      accessor: (row) => row.active,
      meta: { type: 'boolean' }
    };
    
    const schema = createColumnSchema(column, column.meta);
    expect(schema.parse(true)).toBe(true);
    expect(schema.parse(false)).toBe(false);
  });
  
  it('should support optional fields', () => {
    const column: ColumnConfig<any, string> = {
      id: 'description',
      header: 'Description',
      accessor: (row) => row.description,
      meta: { type: 'string', required: false }
    };
    
    const schema = createColumnSchema(column, column.meta);
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.parse('test')).toBe('test');
  });
  
  it('should support custom zodSchema', () => {
    const column: ColumnConfig<any, string> = {
      id: 'email',
      header: 'Email',
      accessor: (row) => row.email,
      meta: {
        type: 'string',
        zodSchema: z.string().email()
      }
    };
    
    const schema = createColumnSchema(column, column.meta);
    expect(schema.parse('test@example.com')).toBe('test@example.com');
    expect(() => schema.parse('invalid-email')).toThrow();
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: 部分测试失败（因为功能未完全实现）

**Step 3: 实现完整功能**

```typescript
// packages/maita-table-core/src/validation.ts
import { z } from 'zod';
import type { ColumnConfig, ColumnMeta } from './column';

export function createColumnSchema<Row, Value>(
  column: ColumnConfig<Row, Value>,
  meta?: ColumnMeta<Row, Value>
): z.ZodType<Value> {
  // 如果提供了自定义 zodSchema，直接使用
  if (meta?.zodSchema) {
    return meta.zodSchema as z.ZodType<Value>;
  }
  
  let schema: z.ZodType<Value>;
  
  // 基础类型
  switch (meta?.type) {
    case 'number':
    case 'integer':
      schema = z.number() as z.ZodType<Value>;
      if (meta?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(meta.min) as z.ZodType<Value>;
      }
      if (meta?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(meta.max) as z.ZodType<Value>;
      }
      if (meta?.type === 'integer') {
        schema = (schema as z.ZodNumber).int() as z.ZodType<Value>;
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
  if (meta?.required === false) {
    schema = schema.optional() as z.ZodType<Value>;
  }
  
  // 自定义验证（向后兼容）
  if (meta?.validate && !meta?.zodSchema) {
    schema = schema.refine(
      (val) => {
        const result = meta.validate!(val, {} as Row);
        return result === null || result === undefined;
      },
      { message: (meta.validate as any).toString() }
    ) as z.ZodType<Value>;
  }
  
  return schema;
}
```

**Step 4: 运行测试确认通过**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: 所有测试通过

**Step 5: Commit**

```bash
git add packages/maita-table-core/src/validation.ts packages/maita-table-core/tests/validation.test.ts
git commit -m "feat(core): implement createColumnSchema with Zod support"
```

---

### Task 1.4: 实现 createRowSchema 函数

**Files:**
- Modify: `packages/maita-table-core/src/validation.ts`
- Modify: `packages/maita-table-core/tests/validation.test.ts`

**Step 1: 编写失败的测试**

```typescript
// packages/maita-table-core/tests/validation.test.ts
describe('createRowSchema', () => {
  it('should create row schema from columns', () => {
    const columns: ColumnConfig<any>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true }
      },
      {
        id: 'price',
        header: 'Price',
        accessor: (row) => row.price,
        meta: { type: 'number', min: 0 }
      }
    ];
    
    const schema = createRowSchema(columns);
    const result = schema.safeParse({ name: 'Test', price: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test');
      expect(result.data.price).toBe(100);
    }
  });
  
  it('should validate row with errors', () => {
    const columns: ColumnConfig<any>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true }
      }
    ];
    
    const schema = createRowSchema(columns);
    const result = schema.safeParse({});
    expect(result.success).toBe(false);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: FAIL with "createRowSchema is not defined"

**Step 3: 实现功能**

```typescript
// packages/maita-table-core/src/validation.ts
export function createRowSchema<Row>(
  columns: ColumnConfig<Row>[]
): z.ZodType<Row> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const col of columns) {
    if (col.meta?.editable !== false) {
      shape[col.id] = createColumnSchema(col, col.meta);
    }
  }
  
  return z.object(shape) as z.ZodType<Row>;
}
```

**Step 4: 运行测试确认通过**

Run: `cd packages/maita-table-core && pnpm test validation.test.ts`
Expected: 所有测试通过

**Step 5: Commit**

```bash
git add packages/maita-table-core/src/validation.ts packages/maita-table-core/tests/validation.test.ts
git commit -m "feat(core): implement createRowSchema"
```

---

### Task 1.5: 扩展 ColumnMeta 类型

**Files:**
- Modify: `packages/maita-table-core/src/column.ts`

**Step 1: 扩展类型定义**

```typescript
// packages/maita-table-core/src/column.ts
import type { z } from 'zod';

export type ColumnMeta<Row = any, Value = any> = {
  // ... 现有字段 ...
  
  /**
   * 可选的 Zod Schema，用于结构化验证
   * 如果提供，将优先使用此 Schema 进行验证
   */
  zodSchema?: z.ZodType<Value>;
  
  // ... 其他字段 ...
};
```

**Step 2: 运行类型检查**

Run: `cd packages/maita-table-core && pnpm run type-check`
Expected: 类型检查通过

**Step 3: Commit**

```bash
git add packages/maita-table-core/src/column.ts
git commit -m "feat(core): extend ColumnMeta with zodSchema support"
```

---

## 阶段 2：状态解耦

### Task 2.1: 扩展 DataGridRuntimeState

**Files:**
- Modify: `packages/maita-table-core/src/state.ts`
- Modify: `packages/maita-table-core/tests/state.test.ts` (如果存在)

**Step 1: 定义新类型**

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
  editedRow: Partial<Row>;
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
  // 现有字段
  editingCell?: EditingCell;
  editingDraftValues: Record<string, unknown>;
  validationErrors: Record<string, string>;
  
  // 新增字段
  pendingEdits: PendingEdit<Row>[];
  submission: SubmissionState;
  rowValidationErrors: Record<string, string[]>; // rowKey -> errors
}
```

**Step 2: 更新默认状态**

```typescript
// packages/maita-table-core/src/state.ts
export function createInitialRuntimeState<Row>(): DataGridRuntimeState<Row> {
  return {
    editingCell: undefined,
    editingDraftValues: {},
    validationErrors: {},
    pendingEdits: [],
    submission: {
      status: 'idle',
      submittedRows: [],
      failedRows: []
    },
    rowValidationErrors: {}
  };
}
```

**Step 3: 运行类型检查**

Run: `cd packages/maita-table-core && pnpm run type-check`
Expected: 类型检查通过

**Step 4: Commit**

```bash
git add packages/maita-table-core/src/state.ts
git commit -m "feat(core): extend DataGridRuntimeState with submission state"
```

---

### Task 2.2: 扩展事件类型

**Files:**
- Modify: `packages/maita-table-core/src/controller.ts`
- Modify: `packages/maita-table-core/tests/controller.test.ts`

**Step 1: 扩展事件类型**

```typescript
// packages/maita-table-core/src/controller.ts
export type DataGridInternalEvent<Row = any> =
  // ... 现有事件 ...
  | {
      type: 'edit/queue';
      cell: EditingCell;
      value: unknown;
    }
  | {
      type: 'edit/queueRow';
      rowKey: string;
      editedRow: Partial<Row>;
    }
  | {
      type: 'edit/removeFromQueue';
      rowKey: string;
    }
  | {
      type: 'submission/start';
      rowKeys?: string[];
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

**Step 2: 编写失败的测试**

```typescript
// packages/maita-table-core/tests/controller.test.ts
describe('edit/queue', () => {
  it('should add edit to queue', () => {
    const controller = createDefaultController();
    const initialState = createInitialState();
    
    const newState = controller.reduce(initialState, {
      type: 'edit/queue',
      cell: { rowKey: 'row1', columnId: 'col1' },
      value: 'new value'
    });
    
    expect(newState.runtime.pendingEdits).toHaveLength(1);
    expect(newState.runtime.pendingEdits[0].rowKey).toBe('row1');
  });
});
```

**Step 3: 运行测试确认失败**

Run: `cd packages/maita-table-core && pnpm test controller.test.ts`
Expected: FAIL

**Step 4: 实现事件处理逻辑**

```typescript
// packages/maita-table-core/src/controller.ts
case 'edit/queue': {
  const cell = event.cell;
  if (!cell) return state;
  
  // 查找或创建待编辑记录
  const existingIndex = state.runtime.pendingEdits.findIndex(
    (e) => e.rowKey === cell.rowKey
  );
  
  const row = state.data.rows.find((r, i) => {
    // 需要根据 rowKey 找到对应的行
    // 这里假设 rowKey 是行的 id 或索引
    return String(i) === cell.rowKey || (r as any).id === cell.rowKey;
  });
  
  if (!row) return state;
  
  const editedRow: Partial<Row> = {
    ...(existingIndex >= 0 ? state.runtime.pendingEdits[existingIndex].editedRow : {}),
    [cell.columnId]: event.value
  };
  
  const pendingEdit: PendingEdit<Row> = {
    rowKey: cell.rowKey,
    rowIndex: state.data.rows.indexOf(row),
    originalRow: row as Row,
    editedRow,
    timestamp: Date.now()
  };
  
  const nextPendingEdits = [...state.runtime.pendingEdits];
  if (existingIndex >= 0) {
    nextPendingEdits[existingIndex] = pendingEdit;
  } else {
    nextPendingEdits.push(pendingEdit);
  }
  
  return {
    ...state,
    runtime: {
      ...state.runtime,
      pendingEdits: nextPendingEdits
    }
  };
}
```

**Step 5: 实现其他事件处理**

继续实现 `edit/queueRow`、`edit/removeFromQueue`、`submission/*` 等事件的处理逻辑。

**Step 6: 运行测试确认通过**

Run: `cd packages/maita-table-core && pnpm test controller.test.ts`
Expected: 所有测试通过

**Step 7: Commit**

```bash
git add packages/maita-table-core/src/controller.ts packages/maita-table-core/tests/controller.test.ts
git commit -m "feat(core): implement edit queue and submission events"
```

---

## 阶段 3：提交机制实现

### Task 3.1: 创建 useTableSubmission Hook

**Files:**
- Create: `packages/maita-table-react/src/hooks/useTableSubmission.ts`
- Create: `packages/maita-table-react/tests/hooks/useTableSubmission.test.ts`

**Step 1: 编写失败的测试**

```typescript
// packages/maita-table-react/tests/hooks/useTableSubmission.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTableSubmission } from '../../src/hooks/useTableSubmission';
import type { ReactDataGridStore } from '../../src/store';

describe('useTableSubmission', () => {
  it('should submit single row', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockStore = createMockStore();
    
    const { result } = renderHook(() =>
      useTableSubmission({
        store: mockStore,
        columns: [],
        onSubmit: mockOnSubmit
      })
    );
    
    await result.current.submitRow('row1');
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `cd packages/maita-table-react && pnpm test useTableSubmission.test.ts`
Expected: FAIL

**Step 3: 实现 Hook**

```typescript
// packages/maita-table-react/src/hooks/useTableSubmission.ts
import { useCallback } from 'react';
import { z } from 'zod';
import type { ReactDataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';
import { createRowSchema } from '@maita-table/core';

export interface UseTableSubmissionOptions<Row> {
  store: ReactDataGridStore<Row>;
  columns: ColumnConfig<Row>[];
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  validateRow?: (row: Row) => Promise<{ success: boolean; errors?: Record<string, string> }>;
}

export function useTableSubmission<Row>(options: UseTableSubmissionOptions<Row>) {
  const { store, columns, onSubmit, validateRow } = options;
  const rowSchema = createRowSchema(columns);
  
  const validateSingleRow = useCallback(async (
    rowKey: string,
    editedRow: Partial<Row>,
    originalRow: Row
  ) => {
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
    
    // 自定义验证
    if (validateRow) {
      const customResult = await validateRow(mergedRow);
      if (!customResult.success) {
        return customResult;
      }
    }
    
    return { success: true };
  }, [rowSchema, validateRow]);
  
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
      store.dispatch({
        type: 'runtime/patch',
        patch: {
          validationErrors: validation.errors || {},
          rowValidationErrors: {
            ...state.runtime.rowValidationErrors,
            [rowKey]: []
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
      
      store.dispatch({
        type: 'submission/success',
        rowKeys: [rowKey]
      });
      
      store.dispatch({
        type: 'edit/removeFromQueue',
        rowKey
      });
    } catch (error) {
      store.dispatch({
        type: 'submission/error',
        rowKeys: [rowKey],
        errors: [{ rowKey, error: (error as Error).message }]
      });
    }
  }, [store, validateSingleRow, onSubmit]);
  
  const submitBatch = useCallback(async (rowKeys?: string[]) => {
    // 实现批量提交逻辑
    // ...
  }, [store, validateSingleRow, onSubmit]);
  
  return {
    submitRow,
    submitBatch,
    validateSingleRow
  };
}
```

**Step 4: 运行测试确认通过**

Run: `cd packages/maita-table-react && pnpm test useTableSubmission.test.ts`
Expected: 所有测试通过

**Step 5: Commit**

```bash
git add packages/maita-table-react/src/hooks/useTableSubmission.ts packages/maita-table-react/tests/hooks/useTableSubmission.test.ts
git commit -m "feat(react): implement useTableSubmission hook"
```

---

### Task 3.2: 创建 SubmissionControls 组件

**Files:**
- Create: `packages/maita-table-react/src/components/SubmissionControls.tsx`
- Create: `packages/maita-table-react/tests/components/SubmissionControls.test.tsx`

**Step 1: 编写失败的测试**

```typescript
// packages/maita-table-react/tests/components/SubmissionControls.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmissionControls } from '../../src/components/SubmissionControls';

describe('SubmissionControls', () => {
  it('should render pending count', () => {
    const mockStore = createMockStore({ pendingEdits: [{ rowKey: 'row1' }] });
    render(<SubmissionControls store={mockStore} columns={[]} onSubmit={vi.fn()} />);
    expect(screen.getByText(/待提交.*1.*行/)).toBeInTheDocument();
  });
});
```

**Step 2: 实现组件**

```typescript
// packages/maita-table-react/src/components/SubmissionControls.tsx
'use client';

import { useTableSubmission } from '../hooks/useTableSubmission';
import type { ReactDataGridStore } from '../store';
import type { ColumnConfig } from '@maita-table/core';
import { Button } from '@/components/ui/button';

export function SubmissionControls<Row>(props: {
  store: ReactDataGridStore<Row>;
  onSubmit: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
  columns: ColumnConfig<Row>[];
}) {
  const { store, onSubmit, columns } = props;
  const state = store.getState();
  const { submitBatch } = useTableSubmission({ store, columns, onSubmit });
  
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
    </div>
  );
}
```

**Step 3: 运行测试确认通过**

Run: `cd packages/maita-table-react && pnpm test SubmissionControls.test.tsx`
Expected: 所有测试通过

**Step 4: Commit**

```bash
git add packages/maita-table-react/src/components/SubmissionControls.tsx packages/maita-table-react/tests/components/SubmissionControls.test.tsx
git commit -m "feat(react): add SubmissionControls component"
```

---

### Task 3.3: 集成到 DataGrid 组件

**Files:**
- Modify: `packages/maita-table-react/src/DataGrid.tsx`

**Step 1: 添加 editMode 属性**

```typescript
// packages/maita-table-react/src/DataGrid.tsx
export type EditMode = 'immediate' | 'single-row' | 'batch';

export interface DataGridProps<Row> {
  // ... 现有属性 ...
  editMode?: EditMode; // 默认 'immediate'
  onSubmit?: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>;
}
```

**Step 2: 根据 editMode 调整编辑行为**

- `immediate`: 保持现有行为（编辑即提交）
- `single-row` / `batch`: 使用 `edit/queue` 事件将编辑加入队列

**Step 3: 集成 SubmissionControls**

在 `DataGrid` 组件底部添加 `SubmissionControls`（当 `editMode !== 'immediate'` 时显示）

**Step 4: Commit**

```bash
git add packages/maita-table-react/src/DataGrid.tsx
git commit -m "feat(react): integrate submission controls into DataGrid"
```

---

## 阶段 4：性能优化

### Task 4.1: 添加防抖和节流

**Files:**
- Modify: `packages/maita-table-react/src/DataGrid.tsx`

**Step 1: 安装 lodash-es 或实现防抖/节流工具**

```bash
cd packages/maita-table-react
pnpm add lodash-es
pnpm add -D @types/lodash-es
```

**Step 2: 在编辑草稿值更新时使用防抖**

```typescript
import { debounce } from 'lodash-es';

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
```

**Step 3: 在验证时使用节流**

```typescript
import { throttle } from 'lodash-es';

const throttledValidate = useMemo(
  () => throttle(async (cellKey: string, value: unknown) => {
    // 执行验证
  }, 300),
  []
);
```

**Step 4: Commit**

```bash
git add packages/maita-table-react/src/DataGrid.tsx packages/maita-table-react/package.json
git commit -m "perf(react): add debounce and throttle for editing"
```

---

### Task 4.2: 限制队列大小

**Files:**
- Modify: `packages/maita-table-core/src/controller.ts`

**Step 1: 在 edit/queue 事件处理中添加队列大小限制**

```typescript
const MAX_PENDING_EDITS = 1000;

// 在 edit/queue 处理中
if (nextPendingEdits.length >= MAX_PENDING_EDITS) {
  nextPendingEdits.shift(); // 移除最旧的
}
```

**Step 2: Commit**

```bash
git add packages/maita-table-core/src/controller.ts
git commit -m "perf(core): limit pending edits queue size"
```

---

## 阶段 5：集成与示例

### Task 5.1: 更新示例页面

**Files:**
- Modify: `src/app/[locale]/dashboard/table-demo/page.tsx`

**Step 1: 添加三种编辑模式的演示**

```typescript
// 添加三个 DataGrid 实例，分别演示三种模式
<DataGrid editMode="immediate" ... />
<DataGrid editMode="single-row" ... />
<DataGrid editMode="batch" ... />
```

**Step 2: Commit**

```bash
git add src/app/[locale]/dashboard/table-demo/page.tsx
git commit -m "docs: add editing mode examples"
```

---

### Task 5.2: 更新 API Route 支持批量提交

**Files:**
- Modify: `src/app/api/maita-table-demo/route.ts`

**Step 1: 添加批量提交处理**

```typescript
if (request.method === 'PATCH') {
  const body = await request.json();
  if (Array.isArray(body)) {
    // 批量更新
    return Response.json({ success: true });
  }
  // 单行更新
}
```

**Step 2: Commit**

```bash
git add src/app/api/maita-table-demo/route.ts
git commit -m "feat(api): support batch submission"
```

---

## 阶段 6：验证与收尾

### Task 6.1: 运行全部测试

**Step 1: 运行所有测试**

```bash
pnpm test
```

**Step 2: 修复失败的测试**

**Step 3: Commit**

```bash
git commit -m "test: fix failing tests"
```

---

### Task 6.2: 运行 Lint

**Step 1: 运行 Lint**

```bash
pnpm run lint
```

**Step 2: 修复 Lint 错误**

**Step 3: Commit**

```bash
git commit -m "style: fix lint errors"
```

---

### Task 6.3: 更新文档

**Files:**
- Create: `docs/maita-table-editing-submission.md`

**Step 1: 编写使用文档**

包含：
- 三种编辑模式的使用方法
- Zod Schema 验证示例
- 提交 Hook 的使用
- 性能优化建议

**Step 2: Commit**

```bash
git add docs/maita-table-editing-submission.md
git commit -m "docs: add editing submission guide"
```

---

## 执行选项

**Plan complete and saved to `docs/plans/2026-02-28-enhance-table-editing-submission.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
