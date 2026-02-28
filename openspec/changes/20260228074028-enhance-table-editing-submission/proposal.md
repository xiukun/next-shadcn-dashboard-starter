# 增强表格编辑提交与验证能力

## 变更概述

本次变更旨在增强 `@maita-table` 的编辑提交与验证能力，支持企业级大数据表格场景下的：
- **结构化验证**：使用 Zod 进行类型安全的验证
- **灵活的提交模式**：支持即时提交、单行提交、批量提交三种模式
- **状态解耦**：编辑状态与业务逻辑分离，提升可测试性和可维护性
- **性能优化**：大数据量下的高效处理策略

## 背景

当前 `@maita-table` 已实现基础的单元格编辑功能（参考变更 `add-maita-table-editing`），但在企业级场景下存在以下限制：

1. **验证不够结构化**：当前使用简单的 `validate` 函数返回错误字符串，无法复用和组合
2. **提交模式单一**：只支持编辑即提交，无法批量提交或撤销
3. **状态耦合**：编辑逻辑与 UI 组件耦合，难以测试和复用
4. **性能问题**：大数据量下频繁的状态更新可能导致性能问题

## 目标

### 功能目标

1. **引入 Zod 验证**：
   - 支持基于 Zod Schema 的列级和行级验证
   - 保持向后兼容，同时支持旧的 `validate` 函数
   - 提供类型安全的验证 API

2. **灵活的提交机制**：
   - **即时提交模式**（默认）：编辑即提交，保持现有行为
   - **单行提交模式**：编辑一行后，点击"提交"按钮提交该行
   - **批量提交模式**：编辑多行后，统一提交所有待提交的行

3. **状态解耦**：
   - 将编辑状态分为三层：UI 状态、编辑队列、提交状态
   - 编辑逻辑与 UI 组件解耦，易于测试和复用

4. **性能优化**：
   - 防抖和节流优化
   - 批量状态更新
   - 虚拟化优化（只验证可见行）

### 技术目标

1. 充分利用 TanStack Table 的优势（状态管理、虚拟化）
2. 保持向后兼容，不破坏现有 API
3. 类型安全（TypeScript + Zod）
4. 可测试性（状态解耦，易于单元测试）

## 设计方案

### 1. Zod 验证集成

在 `@maita-table/core` 中新增验证模块：

- `createColumnSchema<Row, Value>(column, meta): z.ZodType<Value>`：根据列配置生成 Zod Schema
- `createRowSchema<Row>(columns): z.ZodType<Row>`：组合所有列生成行级 Schema
- 保持向后兼容：同时支持 Zod Schema 和旧的 `validate` 函数

### 2. 状态扩展

扩展 `DataGridRuntimeState`：

```typescript
interface PendingEdit<Row> {
  rowKey: string;
  rowIndex: number;
  originalRow: Row;
  editedRow: Partial<Row>;
  timestamp: number;
}

interface SubmissionState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  submittedRows: string[];
  failedRows: Array<{ rowKey: string; error: string }>;
}

interface DataGridRuntimeState<Row> {
  // 现有字段...
  editingCell?: EditingCell;
  editingDraftValues: Record<string, unknown>;
  validationErrors: Record<string, string>;
  
  // 新增字段
  pendingEdits: PendingEdit<Row>[];
  submission: SubmissionState;
  rowValidationErrors: Record<string, string[]>;
}
```

### 3. 事件扩展

新增事件类型：

- `edit/queue`：将编辑加入队列（不立即提交）
- `edit/queueRow`：将整行编辑加入队列
- `edit/removeFromQueue`：从队列移除
- `submission/start`：开始提交
- `submission/success`：提交成功
- `submission/error`：提交失败
- `submission/reset`：重置提交状态

### 4. React Hook 和组件

- `useTableSubmission<Row>(options)`：提供提交相关的 Hook
- `SubmissionControls`：提交控制组件（显示待提交数量、提交按钮等）

### 5. 编辑模式配置

在 `DataGridProps` 中新增 `editMode` 属性：

```typescript
type EditMode = 'immediate' | 'single-row' | 'batch';

interface DataGridProps<Row> {
  // 现有属性...
  editMode?: EditMode; // 默认 'immediate'
}
```

## 实施计划

### 阶段 1：Zod 验证集成（优先级：高）
- 安装 `zod` 依赖
- 实现 `createColumnSchema` 和 `createRowSchema`
- 替换现有的 `validate` 函数为 Zod Schema（保持向后兼容）
- 添加单元测试

### 阶段 2：状态解耦（优先级：高）
- 扩展 `DataGridRuntimeState` 添加编辑队列和提交状态
- 实现新的事件类型和处理逻辑
- 更新控制器处理新事件
- 迁移现有编辑逻辑到新架构

### 阶段 3：提交机制（优先级：中）
- 实现 `useTableSubmission` Hook
- 添加 `SubmissionControls` 组件
- 支持三种编辑模式切换
- 实现批量提交逻辑

### 阶段 4：性能优化（优先级：中）
- 添加防抖和节流
- 优化批量状态更新
- 限制队列大小
- 添加性能监控

## 验收标准

1. ✅ 支持基于 Zod Schema 的验证，同时保持向后兼容
2. ✅ 支持三种编辑模式（即时、单行、批量）
3. ✅ 编辑状态与 UI 组件解耦，易于测试
4. ✅ 在万行数据场景下性能可接受
5. ✅ 所有新功能有完整的单元测试和集成测试
6. ✅ 不破坏现有 API，向后兼容

## 风险评估

### 高风险
- **向后兼容性**：需要确保现有代码不受影响
  - 缓解：保持现有 API 不变，新功能作为可选增强

### 中风险
- **性能问题**：大数据量下的验证和状态更新可能影响性能
  - 缓解：使用防抖、节流、批量更新等优化策略

### 低风险
- **学习曲线**：开发者需要了解 Zod Schema
  - 缓解：提供详细的文档和示例

## 相关变更

- 依赖：`add-maita-table-library`（基础表格功能）
- 依赖：`add-maita-table-editing`（基础编辑功能）
- 增强：本次变更在现有编辑功能基础上增强

## 参考资料

- 讨论文档：`docs/discussions/enterprise-table-editing-submission.md`
- TanStack Table 文档：https://tanstack.com/table/latest
- Zod 文档：https://zod.dev/
