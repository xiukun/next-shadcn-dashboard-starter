# DataGrid 使用说明（@maita-table/react）

本文档说明 `DataGrid` 的**属性（Props）**、**回调（事件）**、以及如何通过 `store` 获取**待提交修改集合**（`pendingEdits`）。

> 适用版本：本项目当前实现（含 `editMode` / `pendingEdits` / `submission` / Zod 验证集成）。

---

## 快速开始

### 1) 基础渲染（只读 / 默认模式）

```tsx
'use client';

import { DataGrid } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';
import type { ColumnConfig } from '@maita-table/core';

type Row = { id: number; name: string; price: number };

const dataSource = createNextDataSource<Row>('/api/maita-table-demo');

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (r) => r.id },
  {
    id: 'name',
    header: '名称',
    accessor: (r) => r.name,
    meta: { type: 'string', editable: true, editorType: 'text', required: true }
  },
  {
    id: 'price',
    header: '价格',
    accessor: (r) => r.price,
    meta: { type: 'number', editable: true, editorType: 'number', min: 0, max: 9999 }
  }
];

export default function Page() {
  return (
    <DataGrid<Row>
      id='demo'
      columns={columns}
      dataSource={dataSource}
      initialViewState={{ pageSize: 50 }}
    />
  );
}
```

---

## DataGrid Props（属性）

`DataGrid` 定义在 `packages/maita-table-react/src/DataGrid.tsx`。

### 必填属性

- **`id: string`**：表格实例 ID（用于区分多个表格实例）。
- **`columns: ColumnConfig<Row>[]`**：列配置（来自 `@maita-table/core`）。
- **`dataSource: DataSource<Row>`**：数据源（例如 `createNextDataSource('/api/xx')`）。

### 可选属性

- **`estimateRowHeight?: number`**：虚拟列表估算行高，默认 `36`。
- **`initialViewState?: Partial<DataGridViewState<Row>>`**：初始视图状态（分页/密度等）。
- **`editMode?: EditMode`**：编辑提交模式，默认 `'immediate'`。
  - `'immediate'`：即时模式（默认，向后兼容）
  - `'single-row'`：单行提交模式（编辑进入队列，手动提交）
  - `'batch'`：批量提交模式（编辑进入队列，提交全部）
- **`onSubmit?: (edits: Array<{ rowKey: string; row: Row }>) => Promise<void>`**
  - 当 `editMode !== 'immediate'` 且传入 `onSubmit` 时，`DataGrid` 会在底部显示提交控件（`SubmissionControls`）。
  - `edits` 是将 `originalRow + editedRow` 合并后的整行数据。
- **`onValidationError?: (errors: Record<string, string>) => void`**
  - 可选：当验证失败时回调（错误结构一般为 `field -> message` 或 `cellKey -> message`）。
- **`onSubmissionError?: (error: Error) => void`**
  - 可选：当提交失败时回调。

---

## ColumnConfig / ColumnMeta（列配置与编辑能力）

列配置在 `@maita-table/core` 中定义（`packages/maita-table-core/src/column.ts`）。

### 常用 `meta` 字段（与编辑相关）

- **`meta.type`**：`'string' | 'number' | 'integer' | 'boolean' | 'date' | ...`
- **`meta.editable?: boolean`**：是否可编辑（默认为可编辑；建议显式设置）。
- **`meta.editorType?: 'text' | 'number' | 'checkbox' | ...`**：编辑器类型。
- **`meta.required?: boolean`**：必填约束（字符串在当前实现中会强制非空）。
- **`meta.min/max`**：数值范围约束。
- **`meta.validate?: (value, row) => string | null | undefined`**：旧式验证（向后兼容）。
- **`meta.zodSchema?: ZodType<Value>`**：列级 Zod Schema（优先级高于 `validate`）。

---

## editMode（三种编辑提交模式）

### 1) `immediate`（默认）

- 用户提交（Enter/blur）后：**立即更新表格当前数据**。
- 该模式主要用于**本地即刻更新**或你在外部自己“监听数据变化并提交后端”的场景。
- 注意：当前实现中，即时模式并不会自动调用 `onSubmit`（`onSubmit` 主要服务于队列提交模式）。

### 2) `single-row`

- 编辑提交后：变更被写入 `runtime.pendingEdits`（队列）。
- 用户通过表格底部控件触发提交（当前 UI 是“提交全部”；如需“按行提交”可基于 `useTableSubmission().submitRow(rowKey)` 自定义 UI）。

### 3) `batch`

- 与 `single-row` 一样进入队列，但推荐一次提交多行。

---

## 如何获取“修改数据的集合”（pendingEdits）

待提交修改集合存放在 **`store.getState().runtime.pendingEdits`**，类型为：

- `PendingEdit<Row>[]`（定义在 `packages/maita-table-core/src/state.ts`）
  - `rowKey: string`
  - `rowIndex: number`
  - `originalRow: Row`
  - `editedRow: Partial<Row>`
  - `timestamp: number`

### 方式 A：在自定义组件中使用 `useDataGrid` 直接读取

适合你想完全自定义工具栏/提交按钮/草稿展示的场景：

```tsx
'use client';

import { useMemo } from 'react';
import { useDataGrid } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';
import type { ColumnConfig } from '@maita-table/core';

type Row = { id: number; name: string; price: number };
const dataSource = createNextDataSource<Row>('/api/maita-table-demo');

export function MyGridWithToolbar(props: { columns: ColumnConfig<Row>[] }) {
  const { store, state } = useDataGrid<Row>({
    id: 'demo',
    columns: props.columns,
    dataSource,
    initialViewState: { pageSize: 50 }
  });

  const pendingEdits = state.runtime.pendingEdits;
  const mergedRows = useMemo(() => {
    return pendingEdits.map((e) => ({
      rowKey: e.rowKey,
      row: { ...e.originalRow, ...e.editedRow }
    }));
  }, [pendingEdits]);

  return (
    <div className='space-y-3'>
      <div className='text-sm text-muted-foreground'>
        待提交：{pendingEdits.length} 行
      </div>

      {/* 这里你可以渲染 DataGrid（如果要共享同一个 store，需要做进一步封装） */}
      <pre className='text-xs'>{JSON.stringify(mergedRows, null, 2)}</pre>
    </div>
  );
}
```

> 注意：当前 `DataGrid` 内部会自己创建 store（通过 `useDataGrid(props)`）。如果你希望“同一个 store 同时驱动 DataGrid + Toolbar”，建议后续把 `DataGrid` 改造成可选接收外部 store（这是可扩展方向，当前实现尚未暴露该 prop）。

### 方式 B：提交时直接从 `onSubmit` 拿到合并后的 rows（推荐）

当使用 `editMode !== 'immediate'` 时，**最简单稳定**的做法是用 `onSubmit`：

```tsx
<DataGrid<Row>
  id='demo'
  columns={columns}
  dataSource={dataSource}
  editMode='batch'
  onSubmit={async (edits) => {
    // edits: Array<{ rowKey: string; row: Row }>
    // 这就是“修改数据集合（合并后）”
    await fetch('/api/maita-table-demo/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits })
    });
  }}
/>;
```

---

## 提交逻辑（useTableSubmission）

`packages/maita-table-react/src/hooks/useTableSubmission.ts` 暴露：

- **`submitRow(rowKey: string)`**：提交单行（从 `pendingEdits` 找到对应 rowKey）
- **`submitBatch(rowKeys?: string[])`**：批量提交（不传则提交队列全部）
- **`validateSingleRow(...)`**：单行验证（Zod + 可选自定义 `validateRow`）

`onSubmit` 的入参格式为：

```ts
Array<{ rowKey: string; row: Row }>
```

其中 `row` 是：

```ts
{ ...originalRow, ...editedRow }
```

---

## 内部事件（事件类型 / dispatch）

`store.dispatch(event)` 会把事件交给 core controller 的 `reduce()` 处理。

常用事件（见 `packages/maita-table-core/src/controller.ts`）：

- 编辑：
  - `edit/start` / `edit/change` / `edit/cancel` / `edit/commit`
  - `edit/queue`（非即时模式把单元格加入队列）
  - `edit/queueRow`（一次性把整行加入队列）
  - `edit/removeFromQueue`（移除某一行的队列记录）
- 提交：
  - `submission/start` / `submission/success` / `submission/error` / `submission/reset`
- 运行时 patch：
  - `runtime/patch`

> 一般业务层不需要直接 dispatch 这些事件，优先使用 `DataGrid` / `useTableSubmission` 即可。

---

## 常见问题

### Q1：`immediate` 模式下如何拿到“改了什么”？

当前实现的 `immediate` 模式会直接更新 `state.data.rows`，不会自动进入 `pendingEdits`。如果你要追踪变更集合，建议：

- 使用 `editMode='batch'` / `'single-row'`（天然有 `pendingEdits`）
- 或自行在外层维护 diff（订阅 store，在 `edit/commit` 时记录变更）

### Q2：如何只提交某一行？

使用 `useTableSubmission(...).submitRow(rowKey)`，并自行实现“按行提交按钮”。

### Q3：验证如何配置？

- **列级**：`meta.zodSchema`（优先）或 `meta.validate`
- **行级**：`createRowSchema(columns)`（内部已用于 `useTableSubmission` 的行级校验）

---

## 相关文件索引

- `packages/maita-table-react/src/DataGrid.tsx`
- `packages/maita-table-react/src/useDataGrid.tsx`
- `packages/maita-table-react/src/store.ts`
- `packages/maita-table-react/src/hooks/useTableSubmission.ts`
- `packages/maita-table-core/src/state.ts`
- `packages/maita-table-core/src/controller.ts`
- `packages/maita-table-core/src/validation.ts`

