## 1. 规划与规范
- [ ] 1.1 完成 OpenSpec 变更提案（proposal.md）和增量规范
- [ ] 1.2 运行 `openspec-cn validate add-data-grid-row-selection --strict` 验证
- [ ] 1.3 在 `docs/plans/` 下创建实现计划文档（如需要）

## 2. 阶段 1：行选择模型与 Checkbox 列
- [x] 2.1 扩展 `packages/maita-table-core/src/state.ts`，完善选择状态模型（`selectionMode` 类型定义）
- [x] 2.2 创建 `packages/maita-table-react/src/hooks/useRowSelection.ts`，实现选择逻辑 Hook
- [x] 2.3 实现单选模式逻辑（选择新行时取消之前的选择）
- [x] 2.4 实现多选模式逻辑（支持多行选择/取消）
- [x] 2.5 创建 `packages/maita-table-react/src/components/SelectionCheckbox.tsx`，实现 checkbox 列组件
- [x] 2.6 在 `DataGrid.tsx` 中集成 checkbox 列（固定在最左侧）
- [x] 2.7 实现行 checkbox 的点击处理（选择/取消选择）
- [x] 2.8 实现选中行的视觉反馈（行高亮样式）
- [x] 2.9 扩展 `DataGridProps`，添加 `selectionMode`、`selectedRowKeys`、`onSelectionChange`、`enableRowSelection` 属性
- [x] 2.10 为选择逻辑添加单元测试（TDD）

## 3. 阶段 2：全选逻辑与范围选择
- [x] 3.1 实现表头 checkbox 的全选逻辑（当前页全选）
- [x] 3.2 实现表头 checkbox 的半选状态（indeterminate）显示
- [x] 3.3 实现 Shift + Click 范围选择逻辑
- [x] 3.4 处理范围选择的边界情况（无选中行、单选模式等）
- [x] 3.5 为全选和范围选择添加单元测试

## 4. 阶段 3：选择状态持久化
- [x] 4.1 创建 `packages/maita-table-react/src/hooks/useSelectionPersistence.ts`，实现持久化逻辑
- [x] 4.2 实现选择状态保存到 localStorage（key: `grid-${gridId}-selection`）
- [x] 4.3 实现选择状态恢复逻辑（初始化时读取并匹配行数据）
- [x] 4.4 实现清除持久化状态的逻辑
- [x] 4.5 扩展 `DataGridProps`，添加 `enableSelectionPersistence` 属性（默认 true）
- [x] 4.6 为持久化逻辑添加单元测试

## 5. 集成与示例
- [x] 6.1 更新 `src/app/[locale]/dashboard/table-demo/page.tsx`，演示选择功能
- [x] 6.2 添加多语言支持（i18n）：选择相关的文本（"全选"、"取消全选"、"复制"、"导出"等）
- [ ] 6.3 更新文档，说明如何使用行选择功能

## 7. 验证与收尾
- [x] 7.1 运行全部测试与 lint，确保所有包构建通过（测试全部通过）
- [x] 7.2 对照 OpenSpec 规范与任务列表进行自查
- [x] 7.3 执行 Code Review（需求对照 + 技术审查）- 已完成，见 CODE_REVIEW.md
- [x] 7.4 更新 tasks.md 状态为完成
- [x] 7.5 OpenSpec 归档完成（2026-03-01-add-data-grid-row-selection）