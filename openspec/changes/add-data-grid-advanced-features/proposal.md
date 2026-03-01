# 增强 DataGrid 数据处理与分析能力

## 为什么

当前 `data-grid` 已具备基础的表格渲染、编辑、列管理、行选择能力，但在企业级数据分析场景下，用户需要强大的数据处理与分析能力：

- **过滤体验不足**：当前过滤功能基础，缺少类似 AG Grid 的浮动过滤和集过滤器，用户需要更直观的过滤交互
- **分组功能缺失**：虽然 `DataGridQuery` 已支持 `groupBy`，但 UI 层尚未实现分组展示和交互
- **聚合功能缺失**：无法在分组行或表尾显示统计信息（sum, min, max, avg），限制了数据分析能力
- **列头功能分散**：排序、过滤等功能缺少统一的列头 UI，用户体验不连贯
- **组件代码过长**：`DataGrid.tsx` 超过 1300 行，需要合理拆分以提高可维护性

这些能力的缺失限制了 `data-grid` 在数据分析、报表、BI 等场景下的可用性。

## 变更内容

### 阶段 1：列头重构与排序增强

- **拆分列头组件**：
  - 创建 `ColumnHeader` 组件，管理列头布局和样式
  - 创建 `ColumnHeaderContent` 组件，显示标题和操作按钮
  - 创建 `SortIndicator` 组件，显示排序状态
  - 将列头渲染逻辑从 `DataGrid.tsx` 中分离

- **增强排序功能**：
  - 支持多列排序（按住 Ctrl/Cmd 点击列头）
  - 排序状态可视化（↑ ↓ 图标）
  - 通过 `meta.enableSorting` 控制是否可排序

### 阶段 2：浮动过滤与基础过滤

- **浮动过滤器**：
  - 在表头下方显示实时过滤输入框（参考 AG Grid）
  - 支持文本、数字、日期类型
  - 使用防抖优化性能（300ms）
  - 通过 `meta.enableFloatingFilter` 控制显示

- **过滤菜单**：
  - 创建 `ColumnMenu` 组件（Popover）
  - 创建 `FilterMenu` 组件，根据 `meta.filterType` 渲染对应过滤器
  - 支持文本过滤（contains, startsWith, equals）
  - 支持数字过滤（>, <, =, between）
  - 支持日期过滤（date picker）

- **过滤指示器**：
  - 创建 `FilterIndicator` 组件，显示过滤状态
  - 有过滤条件时高亮显示

### 阶段 3：集过滤器（Set Filter）

- **集过滤器组件**：
  - 创建 `SetFilter` 组件，类似 Excel 的多选复选框过滤
  - 支持搜索过滤选项（`meta.setFilterSearchable`）
  - 支持"全选"功能
  - 从数据源获取唯一值列表或使用 `meta.setFilterOptions`

- **性能优化**：
  - 选项列表懒加载
  - 大量选项时使用虚拟滚动

### 阶段 4：分组与聚合

- **行分组**：
  - 创建 `GroupRow` 组件，渲染分组行
  - 支持折叠/展开分组
  - 支持多级分组
  - 分组行可显示聚合值
  - 通过 `meta.enableGrouping` 控制是否可分组

- **值聚合**：
  - 创建 `AggregationCell` 组件，显示聚合值
  - 支持 sum, min, max, avg, count
  - 在分组行和表尾显示
  - 通过 `meta.aggregationFunctions` 配置可用聚合函数
  - 通过 `meta.defaultAggregation` 设置默认聚合

- **分组指示器**：
  - 创建 `GroupIndicator` 组件，显示当前列是否用于分组

### 阶段 5：树形数据（可选）

- **树形数据支持**：
  - 基于分组功能扩展
  - 支持父子关系数据
  - 支持展开/折叠节点
  - 支持树形数据的选择和编辑

## 影响

### 受影响规范
- `data-grid`（新增高级过滤、分组、聚合相关需求）

### 受影响代码

**新增文件**：
- `packages/maita-table-react/src/components/ColumnHeader.tsx`
- `packages/maita-table-react/src/components/ColumnHeaderContent.tsx`
- `packages/maita-table-react/src/components/SortIndicator.tsx`
- `packages/maita-table-react/src/components/FilterIndicator.tsx`
- `packages/maita-table-react/src/components/FloatingFilter.tsx`
- `packages/maita-table-react/src/components/ColumnMenu.tsx`
- `packages/maita-table-react/src/components/FilterMenu.tsx`
- `packages/maita-table-react/src/components/SetFilter.tsx`
- `packages/maita-table-react/src/components/GroupRow.tsx`
- `packages/maita-table-react/src/components/GroupIndicator.tsx`
- `packages/maita-table-react/src/components/AggregationCell.tsx`
- `packages/maita-table-react/src/hooks/useColumnSorting.ts`
- `packages/maita-table-react/src/hooks/useColumnFiltering.ts`
- `packages/maita-table-react/src/hooks/useRowGrouping.ts`
- `packages/maita-table-react/src/hooks/useAggregation.ts`

**修改文件**：
- `packages/maita-table-core/src/column.ts`（扩展 ColumnMeta）
- `packages/maita-table-react/src/DataGrid.tsx`（重构列头渲染，使用新组件）

### 新增依赖
- **无需新增依赖**！所有需要的库都已安装：
  - ✅ `@tanstack/react-table` - 提供排序、过滤、分组、聚合功能（`getSortedRowModel`, `getFilteredRowModel`, `getGroupedRowModel`, `aggregationFns`）
  - ✅ `@radix-ui/react-popover` - 提供浮动层定位（底层使用 @floating-ui/react，自动处理定位和碰撞检测）
  - ✅ `cmdk` - 提供高性能搜索（用于集过滤器的选项搜索）
  - ✅ `@tanstack/react-virtual` - 提供虚拟化（已在使用，用于分组行虚拟化）
  - ✅ shadcn/ui 组件 - Popover, Command, Input, Checkbox, Select, ScrollArea, Collapsible 等

## 实施策略

1. **先重构列头**（阶段 1）：
   - 拆分组件，降低 `DataGrid.tsx` 复杂度
   - 为后续功能打好基础

2. **再实现过滤**（阶段 2-3）：
   - 浮动过滤提升用户体验
   - 集过滤器增强过滤能力

3. **最后实现分组聚合**（阶段 4）：
   - 核心数据分析能力
   - 需要前后端配合

4. **可选树形数据**（阶段 5）：
   - 按需实施

## 验收标准

1. ✅ 列头组件拆分完成，`DataGrid.tsx` 代码行数减少 30%+
2. ✅ 支持多列排序，排序状态可视化
3. ✅ 浮动过滤器正常工作，防抖优化生效
4. ✅ 集过滤器支持搜索和多选
5. ✅ 行分组支持折叠/展开，多级分组
6. ✅ 值聚合在分组行和表尾正确显示
7. ✅ 所有功能通过列属性（meta）控制
8. ✅ 性能测试：1000+ 行数据下流畅操作

## 参考

- [AG Grid Examples](https://ag-grid.com/example/)
- [AG Grid Set Filter](https://www.ag-grid.com/react-data-grid/filter-set-filter/)
- [AG Grid Grouping](https://www.ag-grid.com/react-data-grid/grouping/)
- [AG Grid Aggregation](https://www.ag-grid.com/react-data-grid/aggregation/)
