# 变更：抽象 @maita-table 表格组件库并接入现有管理后台

## 为什么
当前项目中表格能力分散在各个 feature 内部，无法在多个项目之间复用，也难以在企业级场景下统一优化性能（万行数据虚拟化）、复杂交互（编辑、过滤、分组）以及状态管理（Zustand）。需要一个可在多项目中复用的、基于 TanStack Table 的表格内核与 React 适配层，并通过 monorepo 的方式在当前项目内先落地为 `@maita-table/*` 组件库。

## 变更内容
- 新增 monorepo 结构，将现有 Next 管理后台移动到 `apps/admin-dashboard` 下管理。
- 新增 `@maita-table/core` 包，定义与 UI 无关的表格查询协议、列配置模型、插件机制与控制器接口。
- 新增 `@maita-table/react` 包，基于 TanStack React Table 与 Zustand 实现表格实例的 React 绑定与渲染基础。
- 新增 `@maita-table/next` 适配包，封装与 Next.js App Router 相关的数据源创建与错误处理。
- 新增至少一个示例表格（例如产品列表），在 `apps/admin-dashboard` 中以 `@maita-table/*` 实现替换现有列表页。
- 为上述能力补充基础测试与文档，支持后续在其他项目中直接接入。

## 影响
- 受影响规范：将新增一个 `data-grid` 能力规范，用于描述通用表格内核与多项目复用约束。
- 受影响代码：
  - 根目录包管理结构与 `pnpm-workspace.yaml`。
  - 新增 `packages/maita-table-*` 目录及其源码、测试与构建配置。
  - `apps/admin-dashboard` 中使用表格的页面会逐步迁移为使用 `@maita-table/*`。

