## 1. 规划与规范
- [x] 1.1 完成 OpenSpec 变更提案（proposal.md）和增量规范
- [x] 1.2 运行 `openspec-cn validate refactor-datagrid-store-and-split-components --strict` 验证
- [ ] 1.3 在 `docs/plans/` 下创建实现计划文档（如需要）

## 2. 阶段 1：创建新的 Store 结构（Zustand Slice 模式）
- [x] 2.1 创建 `packages/maita-table-react/src/store/types.ts`，定义 Store 类型
- [x] 2.2 创建 `packages/maita-table-react/src/store/slices/viewSlice.ts`，实现视图状态 slice
- [x] 2.3 创建 `packages/maita-table-react/src/store/slices/runtimeSlice.ts`，实现运行时状态 slice
- [x] 2.4 创建 `packages/maita-table-react/src/store/slices/dataSlice.ts`，实现数据状态 slice
- [x] 2.5 创建 `packages/maita-table-react/src/store/slices/paginationSlice.ts`，实现分页状态 slice
- [x] 2.6 创建 `packages/maita-table-react/src/store/index.ts`，组合所有 slices
- [ ] 2.7 为 Store slices 添加单元测试

## 3. 阶段 2：重构现有 Hooks 使用 Slice Actions
- [x] 3.1 重构 `useColumnSorting.ts`，使用 `viewSlice.setSort` 替代 `setState`
- [x] 3.2 重构 `useColumnFiltering.ts`，使用 `viewSlice.setFilters` 替代 `setState`
- [x] 3.3 重构 `useRowSelection.ts`，使用 `runtimeSlice` actions 替代 `setState`
- [x] 3.4 重构 `useTableSubmission.ts`，使用 `runtimeSlice` actions 替代 `dispatch`
- [x] 3.5 更新 `useColumnPersistence.ts`，使用新的 store API（无需修改，不依赖 store）
- [x] 3.6 更新 `useSelectionPersistence.ts`，使用新的 store API
- [x] 3.7 更新 `SubmissionControls.tsx`，使用新的 store API
- [ ] 3.8 验证所有 hooks 功能正常

## 4. 阶段 3：创建新的 Hooks
- [x] 4.1 创建 `packages/maita-table-react/src/hooks/useTableInstance.ts`，管理 TanStack Table 实例
- [x] 4.2 创建 `packages/maita-table-react/src/hooks/useTableColumns.ts`，管理列定义生成
- [x] 4.3 创建 `packages/maita-table-react/src/hooks/useTablePagination.ts`，管理分页逻辑
- [x] 4.4 创建 `packages/maita-table-react/src/hooks/useTableVirtualization.ts`，管理虚拟化逻辑
- [x] 4.5 创建 `packages/maita-table-react/src/hooks/useTableEvents.ts`，管理事件处理
- [ ] 4.6 为所有新 hooks 添加单元测试（后续阶段）

## 5. 阶段 4：拆分渲染组件
- [x] 5.1 创建 `packages/maita-table-react/src/components/DataGridHeader.tsx`，提取表头渲染逻辑
- [x] 5.2 创建 `packages/maita-table-react/src/components/DataGridBody.tsx`，提取表体渲染逻辑
- [x] 5.3 创建 `packages/maita-table-react/src/components/DataGridCell.tsx`，提取单元格渲染逻辑
- [ ] 5.4 验证所有组件功能正常（排序、过滤、选择、编辑等）

## 6. 阶段 5：创建分页组件
- [x] 6.1 实现 `DataGridPagination.tsx` 组件，包含分页控件 UI
- [x] 6.2 集成客户端分页模式（`getPaginationRowModel()`）
- [x] 6.3 集成服务端分页模式（`manualPagination: true`）
- [x] 6.4 添加分页状态持久化（可选）
- [ ] 6.5 为分页组件添加单元测试

## 6. 阶段 6：重构主组件
- [x] 6.1 重构 `DataGrid.tsx`，使用新的 hooks 和组件
- [x] 6.2 简化主组件逻辑，代码行数从 566 行减少到 494 行（提取了列状态处理逻辑到 `useColumnStateHandlers` hook）
- [x] 6.3 更新 `useDataGrid.tsx`，使用新的 store API
- [x] 6.4 删除旧的 `store.ts` 文件（已删除，不再需要向后兼容）
- [x] 6.5 更新所有使用 DataGrid 的地方（已在 `table-filter-demo/page.tsx` 中使用新 API）

## 7. 验证与收尾
- [x] 7.1 运行全部测试与 lint，确保所有包构建通过（lint 通过）
- [ ] 7.2 性能测试：1000+ 行数据下流畅操作（手动测试）
- [x] 7.3 对照 OpenSpec 规范与任务列表进行自查（主要任务已完成）
- [ ] 7.4 执行 Code Review（需求对照 + 技术审查）
- [ ] 7.5 更新 tasks.md 状态为完成
