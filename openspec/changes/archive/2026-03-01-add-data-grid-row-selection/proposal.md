# 增强 data-grid 行选择能力

## 为什么

当前 `data-grid` 已具备基础的表格渲染、编辑、列管理能力，但在企业级场景下，用户需要强大的行选择能力以支持批量操作：

- **行选择功能缺失**：虽然 `DataGridRuntimeState` 已预留 `selection: Set<RowKey>` 字段，但 UI 层尚未实现选择交互
- **Checkbox 选择列未实现**：用户无法通过 checkbox 选择单行或多行，无法进行批量操作（删除、导出、批量编辑等）
- **全选逻辑缺失**：表头缺少全选 checkbox，无法快速选择当前页或全部数据
- **选择状态未持久化**：用户选择的行在刷新页面或切换视图后丢失，影响用户体验

这些能力的缺失限制了 `data-grid` 在需要批量操作的业务场景下的可用性，特别是数据管理、批量审批、批量导出等场景。

## 变更内容

### 阶段 1：行选择模型与 Checkbox 列

- **扩展选择状态模型**：
  - 在 `DataGridRuntimeState` 中完善 `selection: Set<RowKey>` 的使用
  - 支持单选模式（`selectionMode: 'single'`）和多选模式（`selectionMode: 'multiple'`，默认）
  - 支持范围选择（Shift + Click 选择连续行）

- **实现 Checkbox 选择列**：
  - 在表格最左侧添加固定的 checkbox 列（始终可见，不受列虚拟化影响）
  - 表头 checkbox：支持全选/取消全选当前页
  - 行 checkbox：支持单选/多选行
  - 选中状态视觉反馈（行高亮、checkbox 勾选状态）

- **选择状态回调**：
  - 暴露 `onSelectionChange(selectedRowKeys: RowKey[])` 回调
  - 支持受控模式（通过 `selectedRowKeys` prop 控制选择状态）

### 阶段 2：全选逻辑与范围选择

- **全选逻辑**：
  - 表头 checkbox 点击时，根据当前模式选择：
    - **当前页全选**：仅选择当前可见页的行（适合大数据量场景）
    - **全数据全选**：选择所有数据源中的行（需要数据源支持，可选）
  - 全选状态显示：部分选中（indeterminate）时显示半选状态

- **范围选择**：
  - 按住 Shift + Click 时，选择从上次选中行到当前行的连续区间
  - 支持跨页范围选择（如果数据源支持）

### 阶段 3：选择状态持久化

- **localStorage 持久化**：
  - 选择状态保存到 `localStorage`（key: `grid-${gridId}-selection`）
  - 初始化时自动恢复上次选择的行（如果行数据仍然存在）
  - 支持通过 `enableSelectionPersistence` prop 控制是否启用持久化

## 影响

- **受影响规范**：
  - `data-grid`（新增行选择相关需求）

- **受影响代码**（至少包括）：
  - `packages/maita-table-core/src/state.ts`（扩展选择状态模型）
  - `packages/maita-table-react/src/DataGrid.tsx`（添加 checkbox 列、选择逻辑）
  - `packages/maita-table-react/src/components/SelectionCheckbox.tsx`（新增）
  - `packages/maita-table-react/src/hooks/useRowSelection.ts`（新增）
  - `packages/maita-table-react/src/hooks/useSelectionPersistence.ts`（新增）

- **新增依赖**：
  - 无（使用现有 shadcn/ui 组件，如 `Checkbox`）

## 实施策略

1. **先实现基础选择模型（阶段 1）**：
   - 独立功能，不依赖持久化
   - 快速交付用户价值

2. **再实现全选与范围选择（阶段 2）**：
   - 增强选择体验

3. **最后实现持久化（阶段 3）**：
   - 提升用户体验

## 验收标准

1. ✅ 支持单选和多选模式
2. ✅ 表头 checkbox 支持全选当前页
3. ✅ 行 checkbox 支持选择/取消选择
4. ✅ 支持 Shift + Click 范围选择
5. ✅ 选择状态可通过 `onSelectionChange` 回调获取
6. ✅ 选择状态可持久化到 localStorage（可选）
7. ✅ 所有新功能有完整的单元测试
