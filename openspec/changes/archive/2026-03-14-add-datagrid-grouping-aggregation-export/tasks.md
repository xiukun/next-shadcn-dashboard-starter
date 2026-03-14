## 1. 规划与规范
- [x] 1.1 完成 OpenSpec 变更提案（proposal.md）和增量规范
- [x] 1.2 运行 `openspec-cn validate add-datagrid-grouping-aggregation-export --strict` 验证（当前开发容器未安装 openspec-cn，请在本地环境执行）
- [ ] 1.3 在 `docs/plans/` 下创建实现计划文档（如需要）

## 2. 阶段 1：CSV 导出功能
- [x] 2.1 创建 `packages/maita-table-react/src/utils/export.ts`，实现 `exportToCSV` 函数
- [x] 2.2 实现 `exportSelectedRowsToCSV` 函数，支持导出选中行
- [x] 2.3 添加 CSV 转义逻辑，处理逗号、引号、换行符
- [x] 2.4 添加 BOM 标记，确保 Excel 兼容性
- [x] 2.5 在 `packages/maita-table-react/src/index.ts` 中导出工具函数
- [x] 2.6 在性能测试页面集成导出功能

## 3. 阶段 2：行分组功能（Row Grouping）
- [x] 3.1 在 `useTableInstance` 中集成 `getGroupedRowModel` 和 `getExpandedRowModel`
- [x] 3.2 在 `useTableColumns` 中配置列的 `enableGrouping` 属性
- [x] 3.3 在 `DataGridCell` 中识别并渲染分组行
- [x] 3.4 实现分组行的展开/折叠按钮
- [x] 3.5 实现分组行的缩进显示（根据 `row.depth`）
- [x] 3.6 添加 `defaultGroupExpanded` 属性控制默认展开状态
- [x] 3.7 修复默认展开状态不影响用户手动操作的问题
- [x] 3.8 在性能测试页面配置默认分组（按部门）

## 4. 阶段 3：列聚合功能（Aggregation）
- [x] 4.1 在 `useTableColumns` 中配置列的 `aggregationFn` 属性
- [x] 4.2 在 `DataGridCell` 中识别并渲染聚合单元格
- [x] 4.3 实现聚合值的格式化显示（通过 `meta.aggregationFormatter`）
- [x] 4.4 支持多种聚合函数（sum, avg, min, max, count）
- [x] 4.5 在性能测试页面配置示例聚合（薪资平均值、绩效平均值、项目数总和）

## 5. 阶段 4：性能测试页面
- [x] 5.1 创建 `src/app/[locale]/dashboard/table-performance-demo/page.tsx`
- [x] 5.2 实现数据量控制功能（1K、5K、10K、50K）
- [x] 5.3 实现渲染时间统计
- [x] 5.4 集成 CSV 导出功能
- [x] 5.5 配置分组和聚合功能
- [x] 5.6 添加功能对比清单
- [x] 5.7 在导航配置中添加测试页面入口

## 6. 验证与收尾
- [x] 6.1 运行全部测试与 lint，确保所有包构建通过
- [x] 6.2 使用 Chrome DevTools 进行功能验证
- [x] 6.3 验证分组展开/折叠功能正常工作
- [x] 6.4 验证聚合数据显示正确
- [x] 6.5 验证 CSV 导出功能正常工作
- [x] 6.6 执行 Code Review（需求对照 + 技术审查）
- [x] 6.7 更新 tasks.md 状态为完成
