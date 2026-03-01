## 1. 规划与规范
- [ ] 1.1 完成 OpenSpec 变更提案（proposal.md）和增量规范
- [ ] 1.2 运行 `openspec-cn validate add-data-grid-advanced-features --strict` 验证
- [ ] 1.3 在 `docs/plans/` 下创建实现计划文档（如需要）

## 2. 阶段 1：列头重构与排序增强
- [x] 2.1 扩展 `packages/maita-table-core/src/column.ts`，添加排序、过滤、分组相关 meta 属性
- [x] 2.2 创建 `packages/maita-table-react/src/components/ColumnHeader.tsx`，管理列头布局和样式
- [x] 2.3 创建 `packages/maita-table-react/src/components/ColumnHeaderContent.tsx`，显示列标题和操作按钮
- [x] 2.4 创建 `packages/maita-table-react/src/components/SortIndicator.tsx`，显示排序状态图标
- [x] 2.5 创建 `packages/maita-table-react/src/hooks/useColumnSorting.ts`，集成 TanStack Table 的排序功能
- [x] 2.6 在 `DataGrid.tsx` 中使用新的列头组件，替换现有列头渲染逻辑
- [x] 2.7 集成 TanStack Table 的 `getSortedRowModel`，支持前端排序
- [x] 2.8 实现多列排序功能（Ctrl/Cmd + 点击）
- [x] 2.9 实现排序状态可视化（图标 + 序号）
- [x] 2.10 为排序功能添加单元测试

## 3. 阶段 2：浮动过滤与基础过滤
- [x] 3.1 创建 `packages/maita-table-react/src/components/FilterIndicator.tsx`，显示过滤状态
- [x] 3.2 创建 `packages/maita-table-react/src/components/FloatingFilter.tsx`，实现浮动过滤器
- [x] 3.3 在浮动过滤器中集成防抖处理（使用现有的 `useDebouncedCallback`）
- [x] 3.4 实现文本过滤器（contains, startsWith, equals）
- [x] 3.5 实现数字过滤器（>, <, =, between）
- [x] 3.6 实现日期过滤器（date picker）
- [ ] 3.7 创建 `packages/maita-table-react/src/components/ColumnMenu.tsx`，使用 shadcn/ui Popover
- [x] 3.8 创建 `packages/maita-table-react/src/components/FilterMenu.tsx`，根据 filterType 渲染对应过滤器
- [x] 3.9 创建 `packages/maita-table-react/src/hooks/useColumnFiltering.ts`，集成 TanStack Table 的过滤功能
- [x] 3.10 集成 TanStack Table 的 `getFilteredRowModel`，支持前端过滤
- [x] 3.11 为过滤功能添加单元测试

## 4. 阶段 3：集过滤器（Set Filter）
- [ ] 4.1 创建 `packages/maita-table-react/src/components/SetFilter.tsx`，实现集过滤器组件
- [ ] 4.2 集成 shadcn/ui 的 `Command` 组件（cmdk），实现搜索功能
- [ ] 4.3 集成 shadcn/ui 的 `Checkbox` 组件，实现多选功能
- [ ] 4.4 实现"全选"功能
- [ ] 4.5 实现选项列表获取逻辑（从 meta.setFilterOptions 或数据源）
- [ ] 4.6 集成 shadcn/ui 的 `ScrollArea` 组件，支持长列表滚动
- [ ] 4.7 性能优化：选项列表虚拟化（如果选项很多）
- [ ] 4.8 为集过滤器添加单元测试

## 5. 阶段 4：分组与聚合
- [ ] 5.1 创建 `packages/maita-table-react/src/components/GroupIndicator.tsx`，显示分组状态
- [ ] 5.2 创建 `packages/maita-table-react/src/components/GroupRow.tsx`，渲染分组行
- [ ] 5.3 集成 shadcn/ui 的 `Collapsible` 组件，实现展开/折叠
- [ ] 5.4 创建 `packages/maita-table-react/src/hooks/useRowGrouping.ts`，集成 TanStack Table 的分组功能
- [ ] 5.5 集成 TanStack Table 的 `getGroupedRowModel` 和 `getExpandedRowModel`
- [ ] 5.6 实现多级分组支持
- [ ] 5.7 创建 `packages/maita-table-react/src/components/AggregationCell.tsx`，显示聚合值
- [ ] 5.8 创建 `packages/maita-table-react/src/hooks/useAggregation.ts`，集成 TanStack Table 的聚合功能
- [ ] 5.9 实现分组行聚合值显示
- [ ] 5.10 实现表尾聚合值显示（可选）
- [ ] 5.11 支持聚合值格式化（使用 meta.aggregationFormatter）
- [ ] 5.12 为分组和聚合功能添加单元测试

## 6. 集成与示例
- [ ] 6.1 更新 `src/app/[locale]/dashboard/table-filter-demo/page.tsx`，演示新功能
- [ ] 6.2 添加多语言支持（i18n）：排序、过滤、分组相关文本
- [ ] 6.3 更新文档，说明如何使用新功能

## 7. 验证与收尾
- [ ] 7.1 运行全部测试与 lint，确保所有包构建通过
- [ ] 7.2 对照 OpenSpec 规范与任务列表进行自查
- [ ] 7.3 执行 Code Review（需求对照 + 技术审查）
- [ ] 7.4 更新 tasks.md 状态为完成
