# 需求核对清单

## 变更信息

- **Change ID**: `20260228074028-enhance-table-editing-submission`
- **变更类型**: 功能增强
- **相关规范**: `data-grid`
- **创建时间**: 2026-02-28

## 验收标准

### 功能验收

#### 1. 结构化验证支持 ✅
- [ ] 支持基于 Zod Schema 的列级验证
- [ ] 支持基于 Zod Schema 的行级验证
- [ ] 保持向后兼容，支持旧的 `validate` 函数
- [ ] 验证错误信息结构化（字段路径 -> 错误消息）

#### 2. 灵活的编辑提交模式 ✅
- [ ] 支持即时提交模式（默认，向后兼容）
- [ ] 支持单行提交模式
- [ ] 支持批量提交模式
- [ ] 三种模式可通过 `editMode` 属性切换

#### 3. 编辑队列管理 ✅
- [ ] 编辑内容自动加入队列（非即时模式）
- [ ] 同一单元格多次编辑时更新队列记录
- [ ] 支持从队列移除编辑记录
- [ ] 队列大小限制（最大 1000 条）

#### 4. 提交状态管理 ✅
- [ ] 跟踪提交状态（idle/submitting/success/error）
- [ ] 提交过程中禁用按钮，显示"提交中..."
- [ ] 提交成功/失败后显示相应提示
- [ ] 批量提交时处理部分失败情况

#### 5. 性能优化 ✅
- [ ] 草稿值更新使用防抖（150ms）
- [ ] 验证操作使用节流（300ms）
- [ ] 虚拟化场景下只验证可见行
- [ ] 批量状态更新优化

#### 6. 状态解耦 ✅
- [ ] 状态分为三层：UI 状态、编辑队列、提交状态
- [ ] 编辑逻辑通过 Hook 提供，独立于 UI 组件
- [ ] 易于单元测试

### 技术验收

- [ ] 所有新功能有完整的单元测试（TDD）
- [ ] 所有新功能有集成测试
- [ ] 代码通过 ESLint 检查
- [ ] TypeScript 类型检查通过
- [ ] 不破坏现有 API，向后兼容
- [ ] 文档完整（API 文档、使用示例）

## 文件列表

### 新增文件

#### @maita-table/core
- `packages/maita-table-core/src/validation.ts` - Zod 验证模块
- `packages/maita-table-core/src/validation.test.ts` - 验证模块测试

#### @maita-table/react
- `packages/maita-table-react/src/hooks/useTableSubmission.ts` - 提交 Hook
- `packages/maita-table-react/src/hooks/useTableSubmission.test.ts` - Hook 测试
- `packages/maita-table-react/src/components/SubmissionControls.tsx` - 提交控制组件
- `packages/maita-table-react/src/components/SubmissionControls.test.tsx` - 组件测试

#### 文档
- `docs/discussions/enterprise-table-editing-submission.md` - 讨论文档（已存在）
- `docs/plans/2026-02-28-enhance-table-editing-submission.md` - 实现计划（待创建）

### 修改文件

#### @maita-table/core
- `packages/maita-table-core/src/state.ts` - 扩展 `DataGridRuntimeState`
- `packages/maita-table-core/src/controller.ts` - 扩展事件类型和处理逻辑
- `packages/maita-table-core/src/column.ts` - 扩展 `ColumnMeta` 类型（可选 `zodSchema`）

#### @maita-table/react
- `packages/maita-table-react/src/DataGrid.tsx` - 集成提交机制和编辑模式
- `packages/maita-table-react/src/store.ts` - 可能需要扩展（如果需要）

#### 示例
- `src/app/[locale]/dashboard/table-demo/page.tsx` - 演示三种编辑模式
- `src/app/api/maita-table-demo/route.ts` - 支持批量提交

### OpenSpec 文件

- `openspec/changes/20260228074028-enhance-table-editing-submission/proposal.md` ✅
- `openspec/changes/20260228074028-enhance-table-editing-submission/tasks.md` ✅
- `openspec/changes/20260228074028-enhance-table-editing-submission/specs/data-grid/spec.md` ✅

## 风险点

### 高风险

#### 1. 向后兼容性 ⚠️
- **风险**: 新功能可能破坏现有 API
- **影响**: 现有代码无法正常工作
- **缓解措施**:
  - 保持现有 API 不变
  - 新功能作为可选增强（通过 `editMode` 属性）
  - 默认行为与现有实现保持一致
  - 充分的回归测试

#### 2. 性能问题 ⚠️
- **风险**: 大数据量下验证和状态更新可能影响性能
- **影响**: 用户体验下降，页面卡顿
- **缓解措施**:
  - 使用防抖和节流优化
  - 批量状态更新
  - 虚拟化优化（只验证可见行）
  - 性能测试和监控

### 中风险

#### 3. 状态管理复杂度 ⚠️
- **风险**: 三层状态管理可能增加复杂度
- **影响**: 代码难以维护，容易出 bug
- **缓解措施**:
  - 清晰的状态分层设计
  - 完善的类型定义
  - 充分的单元测试
  - 详细的文档

#### 4. Zod 学习曲线 ⚠️
- **风险**: 开发者需要学习 Zod Schema
- **影响**: 上手成本增加
- **缓解措施**:
  - 保持向后兼容（支持旧的 validate 函数）
  - 提供详细的文档和示例
  - 提供 Schema 生成工具（`createColumnSchema`）

### 低风险

#### 5. 测试覆盖 ⚠️
- **风险**: 新功能测试覆盖不足
- **影响**: 可能存在隐藏 bug
- **缓解措施**:
  - 使用 TDD 方式开发
  - 单元测试 + 集成测试
  - 代码审查

## 依赖关系

### 前置依赖
- ✅ `add-maita-table-library` - 基础表格功能
- ✅ `add-maita-table-editing` - 基础编辑功能

### 技术依赖
- `zod` - Zod 验证库（需要安装）
- `@tanstack/react-table` - TanStack Table（已存在）
- `zustand` - 状态管理（已存在）

## 测试策略

### 单元测试
- Zod Schema 生成和验证逻辑
- 状态管理逻辑（编辑队列、提交状态）
- 事件处理逻辑
- Hook 逻辑

### 集成测试
- 三种编辑模式的完整流程
- 批量提交流程
- 验证错误处理
- 性能测试（大数据量）

### E2E 测试（可选）
- 用户交互流程
- 提交成功/失败场景

## 里程碑

### 阶段 1：Zod 验证集成（优先级：高）
- 目标：完成 Zod 验证模块
- 验收：所有验证相关测试通过

### 阶段 2：状态解耦（优先级：高）
- 目标：完成状态扩展和事件处理
- 验收：所有状态管理测试通过

### 阶段 3：提交机制（优先级：中）
- 目标：完成提交 Hook 和组件
- 验收：三种编辑模式都能正常工作

### 阶段 4：性能优化（优先级：中）
- 目标：完成性能优化
- 验收：大数据量下性能可接受

## 完成标准

- [ ] 所有验收标准通过
- [ ] 所有测试通过（单元测试 + 集成测试）
- [ ] 代码审查通过
- [ ] 文档完整
- [ ] OpenSpec 变更归档
