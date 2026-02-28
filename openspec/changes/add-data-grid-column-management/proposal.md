# 增强 data-grid 列管理能力

## 为什么

当前 `data-grid` 已具备基础的列配置与行虚拟化能力，但在企业级场景下，用户需要更强大的列管理能力：

- **列虚拟化缺失**：当列数超过 30+ 时，DOM 压力显著增加，影响滚动性能
- **列固定（Pinning）未实现**：虽然 `ColumnConfig` 已定义 `pinned` 字段，但 UI 层尚未实现左右固定列的布局与交互
- **列管理 UI 缺失**：用户无法通过可视化界面调整列顺序、宽度、可见性等，只能通过代码配置
- **列宽自动调整未实现**：用户无法通过双击列边缘自动调整列宽以适应内容

这些能力的缺失限制了 `data-grid` 在复杂业务场景下的可用性，特别是需要处理大量列（如财务报表、数据分析表）的场景。

## 变更内容

### 阶段 1：列管理面板（Column Management UI）

- **新增列管理面板组件**：
  - 提供 Drawer/Popover 形式的列管理界面
  - 支持列的显示/隐藏切换（checkbox）
  - 支持拖拽调整列顺序
  - 支持列宽调整（输入框或滑块）
  - 支持列固定位置切换（左/右/无）
  - 所有变更实时预览，确认后应用

- **状态持久化**：
  - 列顺序、宽度、可见性、固定状态保存到 `DataGridViewState`
  - 支持通过 `localStorage` 持久化（key: `grid-${gridId}-columns`）
  - 初始化时自动恢复用户偏好

### 阶段 2：列虚拟化 + Pinned 布局

- **列虚拟化引擎**：
  - 当可见列数超过阈值（例如 20 列）时，自动启用列虚拟化
  - 使用 `@tanstack/react-virtual` 的水平虚拟化能力
  - 仅渲染可见区域的列，减少 DOM 节点数

- **Pinned 列布局**：
  - 实现三区域布局：左固定区、中间滚动区、右固定区
  - 固定列使用 `position: sticky`，滚动时保持可见
  - 固定列与滚动列共享表头高度，视觉上无缝衔接
  - 支持固定列与滚动列之间的拖拽交互（限制在各自区域内）

- **列宽自动调整**：
  - 双击列边缘时，测量当前可见行中该列的内容宽度
  - 自动设置列宽为 `max(headerWidth, maxCellWidth) + padding`
  - 受 `minWidth`/`maxWidth` 约束

## 影响

- **受影响规范**：
  - `data-grid`（新增列管理相关需求）

- **受影响代码**（至少包括）：
  - `packages/maita-table-core/src/state.ts`（扩展 `DataGridViewState`）
  - `packages/maita-table-core/src/column.ts`（可能需要扩展 `ColumnConfig`）
  - `packages/maita-table-react/src/DataGrid.tsx`（列虚拟化 + pinned 布局）
  - `packages/maita-table-react/src/components/ColumnManagementPanel.tsx`（新增）
  - `packages/maita-table-react/src/hooks/useColumnVirtualization.ts`（新增）
  - `packages/maita-table-react/src/hooks/useColumnPersistence.ts`（新增）

- **新增依赖**：
  - `@dnd-kit/core` + `@dnd-kit/sortable`（列顺序拖拽，如果项目未安装）

## 实施策略

1. **先实现列管理面板（阶段 1）**：
   - 独立功能，不依赖列虚拟化
   - 为后续列虚拟化提供 UI 入口
   - 快速交付用户价值

2. **再实现列虚拟化 + Pinned（阶段 2）**：
   - 核心性能能力，需要更多设计
   - 依赖列管理面板的状态管理能力

3. **Selection 模型延后**：
   - 不在本次变更范围内
   - 后续单独提案实现
