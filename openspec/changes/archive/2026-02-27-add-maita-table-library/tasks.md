## 1. 规划与规范
- [x] 1.1 完成 @maita-table 相关需求梳理与 OpenSpec 变更（proposal 与增量规范）
- [x] 1.2 在 `docs/plans/` 下创建实现计划文档，依据 writing-plans skill 记录执行步骤

## 2. 仓库与 monorepo 结构
- [x] 2.1 在根目录添加或更新 `pnpm-workspace.yaml`，纳入 `packages/*` 与根项目（`.`）
- [x] 2.2 保持现有 Next 管理后台在根目录不迁移，仅通过 workspace 引用 `packages/*`（降低结构变更风险）
- [x] 2.3 在 `packages/` 下创建 `maita-table-core`、`maita-table-react`、`maita-table-next` 的包骨架（package.json、tsconfig、src 结构）

## 3. @maita-table/core 内核
- [x] 3.1 在 `@maita-table/core` 中实现 `DataGridQuery`、`DataGridResult`、排序与过滤等协议类型
- [x] 3.2 在 `@maita-table/core` 中实现 `ColumnConfig`、`ColumnMeta`、`DataGridViewState`、`DataGridRuntimeState` 与 `DataGridController` 接口
- [x] 3.3 为 `@maita-table/core` 添加单元测试（使用 Vitest 或同类工具），覆盖协议序列化与控制器基础行为

## 4. @maita-table/react 绑定层
- [x] 4.1 在 `@maita-table/react` 中使用 TanStack React Table 与 Zustand 实现 `createDataGridStore` 与 `useDataGrid` Hook
- [x] 4.2 提供基础 `DataGrid` 组件（仅包含表头、表体、分页区），并结合 TanStack Virtual 做行虚拟化
- [x] 4.3 为 `@maita-table/react` 添加基础渲染测试（或组件级 smoke test），确保在简单数据源下表格能渲染与交互

## 5. @maita-table/next 适配层
- [x] 5.1 在 `@maita-table/next` 中实现 `createNextDataSource`，基于 Next API Route 封装 `DataSource.fetch`
- [x] 5.2 为 `@maita-table/next` 添加最小测试（例如对 query 序列化与错误处理的单元测试）

## 6. 集成与示例
- [x] 6.1 在根项目中选取一个现有列表页（如 table-demo），改造为使用 `@maita-table/react` 的 `DataGrid`
- [x] 6.2 校验在万行数据模拟场景下（可使用 mock API）表格滚动与交互性能
- [x] 6.3 为表格示例页面补充文档（README 或 mdx），说明如何在新项目中引入 `@maita-table/*`

## 7. 验证与收尾
- [x] 7.1 运行全部测试与 lint，确保三大包与 admin 应用构建通过
- [x] 7.2 对照 OpenSpec 规范与任务列表进行自查，并准备 Code Review 说明

