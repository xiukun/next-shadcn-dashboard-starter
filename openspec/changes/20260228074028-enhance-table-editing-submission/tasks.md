## 1. 规划与规范
- [x] 1.1 完成 OpenSpec 变更提案（proposal.md）和增量规范
- [x] 1.2 运行 `openspec-cn validate 20260228074028-enhance-table-editing-submission --strict` 验证
- [x] 1.3 在 `docs/plans/` 下创建实现计划文档，依据 writing-plans skill 记录执行步骤

## 2. 阶段 1：Zod 验证集成
- [x] 2.1 在 `packages/maita-table-core` 中安装 `zod` 依赖
- [x] 2.2 创建 `packages/maita-table-core/src/validation.ts`，实现 `createColumnSchema` 函数
- [x] 2.3 实现 `createRowSchema` 函数，支持组合所有列生成行级 Schema
- [x] 2.4 添加 `ValidationResult` 类型定义（通过返回值类型实现）
- [x] 2.5 为验证模块添加单元测试（TDD：先写测试）
- [x] 2.6 更新 `ColumnMeta` 类型，支持可选的 `zodSchema` 属性（保持向后兼容）

## 3. 阶段 2：状态解耦
- [x] 3.1 在 `packages/maita-table-core/src/state.ts` 中扩展 `DataGridRuntimeState`，添加 `pendingEdits`、`submission`、`rowValidationErrors` 字段
- [x] 3.2 定义 `PendingEdit` 和 `SubmissionState` 类型
- [x] 3.3 在 `packages/maita-table-core/src/controller.ts` 中扩展 `DataGridInternalEvent`，新增编辑队列和提交相关事件
- [x] 3.4 在控制器中实现新事件的处理逻辑（`edit/queue`、`edit/queueRow`、`submission/*` 等）
- [x] 3.5 为新增的状态和事件处理添加单元测试（TDD）

## 4. 阶段 3：提交机制实现
- [x] 4.1 创建 `packages/maita-table-react/src/hooks/useTableSubmission.ts`，实现 `useTableSubmission` Hook
- [x] 4.2 实现单行提交逻辑（`submitRow`）
- [x] 4.3 实现批量提交逻辑（`submitBatch`）
- [x] 4.4 实现验证逻辑（集成 Zod Schema 和自定义验证）
- [x] 4.5 创建 `packages/maita-table-react/src/components/SubmissionControls.tsx` 组件
- [x] 4.6 在 `DataGrid` 组件中集成 `SubmissionControls` 和 `useTableSubmission`
- [x] 4.7 添加 `editMode` 属性支持（`immediate` | `single-row` | `batch`）
- [x] 4.8 为提交机制添加组件级测试（TDD）

## 5. 阶段 4：性能优化
- [x] 5.1 在编辑草稿值更新时添加防抖（150ms）
- [x] 5.2 在验证时添加节流（300ms）
- [x] 5.3 实现批量状态更新（使用 React 18 的自动批处理）
- [x] 5.4 限制编辑队列大小（最大 1000 条）
- [ ] 5.5 优化虚拟化场景下的验证（只验证可见行）- 可选优化，当前性能已足够

## 6. 集成与示例
- [x] 6.1 更新 `src/app/[locale]/dashboard/table-demo/page.tsx`，演示三种编辑模式
- [x] 6.2 更新 API Route，支持批量提交
- [ ] 6.3 添加多语言支持（i18n）- 部分实现，错误消息可进一步国际化
- [ ] 6.4 更新文档，说明如何使用新的编辑提交功能 - 已创建 Code Review 报告

## 7. 验证与收尾
- [x] 7.1 运行全部测试与 lint，确保所有包构建通过（测试全部通过）
- [x] 7.2 对照 OpenSpec 规范与任务列表进行自查
- [x] 7.3 执行 Code Review（需求对照 + 技术审查）
- [x] 7.4 更新 tasks.md 状态为完成
