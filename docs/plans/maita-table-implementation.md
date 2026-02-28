# @maita-table 实现计划

本文档记录了 `@maita-table` 表格组件库的实现计划与执行步骤，基于 OpenSpec 变更 `add-maita-table-library`。

## 概述

`@maita-table` 是一个基于 TanStack Table 的企业级表格组件库，支持：
- 高性能虚拟化渲染（万行数据）
- 内联编辑与本地校验
- 多项目复用（monorepo 结构）
- Next.js App Router 适配

## 架构设计

### 包结构

```
packages/
├── maita-table-core/     # 内核：协议、控制器、状态管理
├── maita-table-react/    # React 绑定：组件、Hooks、虚拟化
└── maita-table-next/     # Next.js 适配：数据源封装
```

### 核心概念

1. **DataGridController**: 状态控制器，管理查询、排序、过滤、分页等
2. **DataSource**: 数据源接口，抽象数据获取逻辑
3. **ColumnConfig**: 列配置，支持类型、编辑、校验等元数据
4. **DataGrid**: React 组件，基于 TanStack Table + Virtual 渲染

## 实施步骤

### 阶段 1: 内核实现（@maita-table/core）

**目标**: 定义与 UI 无关的表格协议与控制器

**任务清单**:
- [x] 定义 `DataGridQuery`、`DataGridResult` 协议类型
- [x] 实现 `ColumnConfig`、`ColumnMeta` 列配置模型
- [x] 实现 `DataGridViewState`、`DataGridRuntimeState` 状态模型
- [x] 实现 `DataGridController` 控制器接口
- [x] 添加单元测试覆盖基础行为

**关键文件**:
- `packages/maita-table-core/src/types.ts` - 类型定义
- `packages/maita-table-core/src/controller.ts` - 控制器实现
- `packages/maita-table-core/tests/controller.test.ts` - 测试

### 阶段 2: React 绑定（@maita-table/react）

**目标**: 提供 React 组件与 Hooks

**任务清单**:
- [x] 实现 `createDataGridStore` 基于 Zustand 的状态管理
- [x] 实现 `useDataGrid` Hook 连接控制器与 React
- [x] 实现 `DataGrid` 组件，集成 TanStack Table
- [x] 集成 TanStack Virtual 实现行虚拟化
- [x] 实现单元格编辑组件（NumberCell、TextCell、CheckboxCell）
- [x] 添加组件级测试

**关键文件**:
- `packages/maita-table-react/src/store.ts` - Zustand store
- `packages/maita-table-react/src/useDataGrid.tsx` - Hook
- `packages/maita-table-react/src/DataGrid.tsx` - 主组件
- `packages/maita-table-react/src/cells/*.tsx` - 单元格组件

### 阶段 3: Next.js 适配（@maita-table/next）

**目标**: 封装 Next.js App Router 数据源

**任务清单**:
- [x] 实现 `createNextDataSource` 函数
- [x] 处理 API Route 请求与响应
- [x] 添加错误处理与类型安全
- [x] 添加单元测试

**关键文件**:
- `packages/maita-table-next/src/createNextDataSource.ts` - 数据源创建
- `packages/maita-table-next/tests/createNextDataSource.test.ts` - 测试

### 阶段 4: 集成与示例

**目标**: 在现有项目中落地使用

**任务清单**:
- [x] 创建 table-demo 示例页面
- [x] 实现 API Route `/api/maita-table-demo`
- [x] 配置列定义与编辑行为
- [x] 验证万行数据性能
- [x] 添加多语言支持

**关键文件**:
- `src/app/[locale]/dashboard/table-demo/page.tsx` - 示例页面
- `src/app/api/maita-table-demo/route.ts` - API Route
- `src/messages/*/maita-table-demo.json` - 多语言文案

## 技术决策

### 为什么选择 TanStack Table？

- 无头设计，灵活可控
- 强大的类型支持
- 活跃的社区与文档
- 支持虚拟化、排序、过滤等高级功能

### 为什么选择 Zustand？

- 轻量级状态管理
- 与 React 集成简单
- 支持中间件与持久化
- 性能优秀

### 为什么选择 TanStack Virtual？

- 专为虚拟化设计
- 支持动态高度
- 性能优化到位
- 与 TanStack Table 配合良好

## 后续优化方向

1. **功能扩展**:
   - 列排序与过滤 UI
   - 行选择与批量操作
   - 列拖拽排序
   - 导出功能

2. **性能优化**:
   - 列虚拟化（超宽表格）
   - 懒加载与无限滚动
   - 内存优化

3. **多项目复用**:
   - 发布到私有 npm registry
   - 版本管理与变更日志
   - API 文档生成

## 参考资源

- [TanStack Table 文档](https://tanstack.com/table/latest)
- [TanStack Virtual 文档](https://tanstack.com/virtual/latest)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- OpenSpec 变更: `openspec/changes/add-maita-table-library/`
