# 重构 DataGrid Store 并拆分组件

## 为什么

当前 `DataGrid` 组件存在以下问题：

1. **单一 Store 导致状态耦合**：所有状态（view、runtime、data）集中在一个 `DataGridControllerState` 中，不同功能的状态互相干扰，难以隔离和调试
2. **直接 setState 绕过 Controller**：hooks 直接使用 `store.setState`，绕过了 controller 的 reduce 逻辑，导致状态更新不一致
3. **组件代码过长**：`DataGrid.tsx` 超过 1700 行，逻辑堆叠在一起，出问题难以修复
4. **缺少分页功能**：虽然状态中有分页相关字段，但缺少完整的分页 UI 和逻辑

这些问题限制了 `DataGrid` 的可维护性和扩展性。

## 变更内容

### 1. 重构 Zustand Store（使用 Slice 模式）

**完全移除 Controller 模式**，使用纯 Zustand slice 模式：

- **创建独立的 Store Slices**：
  - `viewSlice.ts` - 视图状态（排序、过滤、列配置）
  - `runtimeSlice.ts` - 运行时状态（选择、编辑、提交）
  - `dataSlice.ts` - 数据状态（行数据）
  - `paginationSlice.ts` - 分页状态（新增，独立管理）

- **统一使用 Slice Actions**：
  - 所有状态更新通过 slice actions，不再使用 `setState`
  - 移除 `dispatch` 和 `controller.reduce` 逻辑
  - 保持类型安全和按需订阅

### 2. 拆分 DataGrid 组件

**将 1700+ 行的 `DataGrid.tsx` 拆分为多个模块**：

- **自定义 Hooks**：
  - `useTableInstance.ts` - TanStack Table 实例管理
  - `useTableColumns.ts` - 列定义生成和管理
  - `useTablePagination.ts` - 分页逻辑（新增）
  - `useTableVirtualization.ts` - 虚拟化逻辑
  - `useTableEvents.ts` - 事件处理逻辑

- **渲染组件**：
  - `DataGridHeader.tsx` - 表头渲染组件（约 300-400 行）
  - `DataGridBody.tsx` - 表体渲染组件（约 400-500 行）
  - `DataGridCell.tsx` - 单元格渲染组件（约 200-300 行）
  - `DataGridPagination.tsx` - 分页 UI 组件（新增，约 150-200 行）

- **主组件简化**：
  - `DataGrid.tsx` 简化到 200-300 行，只负责组合 hooks 和组件

### 3. 添加分页功能

**基于 TanStack Table 分页指南实现完整分页**：

- **支持两种分页模式**：
  - 客户端分页（`getPaginationRowModel()`）- 适合小数据量
  - 服务端分页（`manualPagination: true`）- 适合大数据量

- **分页 UI 组件**：
  - 首页/上一页/下一页/末页按钮
  - 页码显示（当前页/总页数）
  - 每页条数选择器
  - 总行数显示（可选）

- **分页状态管理**：
  - 通过 `paginationSlice` 独立管理
  - 支持分页状态持久化（可选）

## 影响

### 受影响规范
- `data-grid`（重构状态管理和组件结构，新增分页功能）

### 受影响代码

**新增文件**：
- `packages/maita-table-react/src/store/index.ts` - Store 创建和导出
- `packages/maita-table-react/src/store/types.ts` - Store 类型定义
- `packages/maita-table-react/src/store/slices/viewSlice.ts` - 视图状态 slice
- `packages/maita-table-react/src/store/slices/runtimeSlice.ts` - 运行时状态 slice
- `packages/maita-table-react/src/store/slices/dataSlice.ts` - 数据状态 slice
- `packages/maita-table-react/src/store/slices/paginationSlice.ts` - 分页状态 slice
- `packages/maita-table-react/src/hooks/useTableInstance.ts` - Table 实例管理
- `packages/maita-table-react/src/hooks/useTableColumns.ts` - 列定义管理
- `packages/maita-table-react/src/hooks/useTablePagination.ts` - 分页逻辑
- `packages/maita-table-react/src/hooks/useTableVirtualization.ts` - 虚拟化逻辑
- `packages/maita-table-react/src/hooks/useTableEvents.ts` - 事件处理
- `packages/maita-table-react/src/components/DataGridHeader.tsx` - 表头组件
- `packages/maita-table-react/src/components/DataGridBody.tsx` - 表体组件
- `packages/maita-table-react/src/components/DataGridCell.tsx` - 单元格组件
- `packages/maita-table-react/src/components/DataGridPagination.tsx` - 分页组件

**修改文件**：
- `packages/maita-table-react/src/DataGrid.tsx` - 重构为主组件（200-300 行）
- `packages/maita-table-react/src/store.ts` - 移除，替换为新 store
- `packages/maita-table-react/src/useDataGrid.tsx` - 重构为使用新 store
- `packages/maita-table-react/src/hooks/useColumnSorting.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useColumnFiltering.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useRowSelection.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useTableSubmission.ts` - 使用 slice actions
- `packages/maita-table-react/src/components/SubmissionControls.tsx` - 使用新 store API

**删除文件**：
- `packages/maita-table-core/src/controller.ts` - 不再需要 Controller 模式（可选，如果其他地方不使用）

### 新增依赖
- **无需新增依赖**！所有需要的库都已安装：
  - ✅ `zustand` - 状态管理（已安装）
  - ✅ `@tanstack/react-table` - 表格核心（已安装，支持分页）
  - ✅ `@tanstack/react-virtual` - 虚拟化（已安装）

## 实施策略

1. **阶段 1：创建新的 Store 结构**
   - 创建 slice 文件
   - 创建新的 store 类型
   - 实现所有 slice actions

2. **阶段 2：重构 Hooks**
   - 重构现有 hooks 使用 slice actions
   - 创建新的 hooks（useTableInstance, useTableColumns 等）

3. **阶段 3：拆分组件**
   - 提取 DataGridHeader
   - 提取 DataGridBody
   - 提取 DataGridCell
   - 创建 DataGridPagination

4. **阶段 4：重构主组件**
   - 简化 DataGrid.tsx
   - 集成所有新组件和 hooks

5. **阶段 5：添加分页功能**
   - 实现 useTablePagination
   - 实现 DataGridPagination 组件
   - 集成到主组件

## 验收标准

1. ✅ Store 完全使用 Slice 模式，无 Controller 依赖
2. ✅ 所有 hooks 使用 slice actions，不再使用 `setState`
3. ✅ `DataGrid.tsx` 代码行数减少到 200-300 行
4. ✅ 所有功能正常工作（排序、过滤、选择、编辑等）
5. ✅ 分页功能完整实现（客户端和服务端模式）
6. ✅ 类型安全完整，无类型错误
7. ✅ 性能测试：1000+ 行数据下流畅操作

## 参考

- [Zustand Slice Pattern](https://github.com/pmndrs/zustand#slices-pattern)
- [TanStack Table Pagination Guide](https://tanstack.com/table/latest/docs/guide/pagination)
- [TanStack Table Examples](https://tanstack.com/table/latest/docs/examples/react/pagination)
