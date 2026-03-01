## 修改需求

### 需求：重构状态管理为 Zustand Slice 模式（Refactor State Management to Zustand Slice Pattern）

系统必须将 DataGrid 的状态管理从 Controller 模式重构为 Zustand Slice 模式，完全移除 Controller 依赖，使用纯 Zustand slice 进行状态管理。

#### 场景：创建 Store Slices
- **当** 重构状态管理时
- **那么** 必须创建 `viewSlice.ts`，管理视图状态（排序、过滤、列配置）
- **并且** 必须创建 `runtimeSlice.ts`，管理运行时状态（选择、编辑、提交）
- **并且** 必须创建 `dataSlice.ts`，管理数据状态（行数据）
- **并且** 必须创建 `paginationSlice.ts`，管理分页状态（独立管理）
- **并且** 所有 slice 必须使用 Zustand 的 `StateCreator` 类型

#### 场景：移除 Controller 模式
- **当** 重构状态管理时
- **那么** 必须完全移除 `DataGridController` 和 `controller.reduce()` 逻辑
- **并且** 必须移除 `store.dispatch()` 方法
- **并且** 所有状态更新必须通过 slice actions，不再使用 `setState`

#### 场景：统一使用 Slice Actions
- **当** hooks 需要更新状态时
- **那么** 必须使用 slice actions（如 `viewSlice.setSort`、`runtimeSlice.setSelection`）
- **并且** 不得直接使用 `store.setState()`
- **并且** 所有 actions 必须保持类型安全

### 需求：拆分 DataGrid 组件（Split DataGrid Component）

系统必须将 `DataGrid.tsx`（1700+ 行）拆分为多个模块，提高代码可维护性和可读性。

#### 场景：创建自定义 Hooks
- **当** 拆分组件逻辑时
- **那么** 必须创建 `useTableInstance.ts`，管理 TanStack Table 实例
- **并且** 必须创建 `useTableColumns.ts`，管理列定义生成
- **并且** 必须创建 `useTablePagination.ts`，管理分页逻辑
- **并且** 必须创建 `useTableVirtualization.ts`，管理虚拟化逻辑
- **并且** 必须创建 `useTableEvents.ts`，管理事件处理

#### 场景：拆分渲染组件
- **当** 拆分组件时
- **那么** 必须创建 `DataGridHeader.tsx`，提取表头渲染逻辑（约 300-400 行）
- **并且** 必须创建 `DataGridBody.tsx`，提取表体渲染逻辑（约 400-500 行）
- **并且** 必须创建 `DataGridCell.tsx`，提取单元格渲染逻辑（约 200-300 行）
- **并且** 主组件 `DataGrid.tsx` 必须简化到 200-300 行

#### 场景：保持功能完整性
- **当** 拆分组件后
- **那么** 所有功能必须正常工作（排序、过滤、选择、编辑等）
- **并且** 性能不得下降
- **并且** 类型安全必须完整

### 需求：重构现有 Hooks 使用 Slice Actions（Refactor Existing Hooks to Use Slice Actions）

系统必须重构所有现有 hooks，使用新的 slice actions 替代直接 `setState` 调用。

#### 场景：重构 useColumnSorting
- **当** 重构 `useColumnSorting.ts` 时
- **那么** 必须使用 `viewSlice.setSort` 替代 `setState`
- **并且** 必须保持功能不变
- **并且** 必须保持类型安全

#### 场景：重构 useColumnFiltering
- **当** 重构 `useColumnFiltering.ts` 时
- **那么** 必须使用 `viewSlice.setFilters` 替代 `setState`
- **并且** 必须保持功能不变
- **并且** 必须保持类型安全

#### 场景：重构 useRowSelection
- **当** 重构 `useRowSelection.ts` 时
- **那么** 必须使用 `runtimeSlice` actions（`setSelection`、`toggleRowSelection` 等）替代 `setState`
- **并且** 必须保持功能不变
- **并且** 必须保持类型安全

#### 场景：重构 useTableSubmission
- **当** 重构 `useTableSubmission.ts` 时
- **那么** 必须使用 `runtimeSlice` actions（`startSubmission`、`completeSubmission` 等）替代 `dispatch`
- **并且** 必须保持功能不变
- **并且** 必须保持类型安全

## 新增需求

### 需求：添加分页功能（Add Pagination Feature）

系统必须提供完整的分页功能，支持客户端和服务端两种分页模式，并集成到 DataGrid 组件中。

#### 场景：客户端分页
- **当** 用户启用分页且 `paginationMode` 为 `'client'` 时
- **那么** 系统必须使用 TanStack Table 的 `getPaginationRowModel()` 进行客户端分页
- **并且** 所有数据必须在客户端，分页由 TanStack Table 处理
- **并且** 适合数据量较小（< 10,000 行）的场景

#### 场景：服务端分页
- **当** 用户启用分页且 `paginationMode` 为 `'server'` 时
- **那么** 系统必须使用 `manualPagination: true` 进行服务端分页
- **并且** 必须提供 `rowCount` 或 `pageCount` 参数
- **并且** 分页查询必须通过 `dataSource` 处理

#### 场景：分页 UI 组件
- **当** 用户启用分页时
- **那么** 系统必须显示分页控件，包含首页/上一页/下一页/末页按钮
- **并且** 必须显示页码信息（当前页/总页数）
- **并且** 必须提供每页条数选择器
- **并且** 可选显示总行数

#### 场景：分页状态管理
- **当** 用户切换页码或每页条数时
- **那么** 分页状态必须通过 `paginationSlice` 管理
- **并且** 支持分页状态持久化（可选）
- **并且** 支持 `onPaginationChange` 回调

#### 场景：分页 Props 配置
- **当** 使用 DataGrid 组件时
- **那么** 必须支持 `enablePagination` 属性（默认 false）
- **并且** 必须支持 `paginationMode` 属性（'client' | 'server'，默认 'client'）
- **并且** 必须支持 `initialPageIndex` 和 `initialPageSize` 属性
- **并且** 必须支持 `pageSizeOptions` 属性（默认 [10, 20, 50, 100, 500, 1000, 5000]）
- **并且** 服务端分页时必须支持 `rowCount` 或 `pageCount` 属性
