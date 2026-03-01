# 增强 DataGrid 数据处理与分析能力

## 为什么

当前 `data-grid` 已具备基础的表格渲染、编辑、列管理、行选择能力，但在企业级数据分析场景下，用户需要强大的数据处理与分析能力：

- **过滤体验不足**：当前过滤功能基础，缺少类似 AG Grid 的浮动过滤，用户需要更直观的过滤交互
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


## 影响

### 受影响规范
- `data-grid`（新增高级过滤相关需求）

### 受影响代码

**新增文件**：
- `packages/maita-table-react/src/components/ColumnHeader.tsx`
- `packages/maita-table-react/src/components/ColumnHeaderContent.tsx`
- `packages/maita-table-react/src/components/SortIndicator.tsx`
- `packages/maita-table-react/src/components/FilterIndicator.tsx`
- `packages/maita-table-react/src/components/FloatingFilter.tsx`
- `packages/maita-table-react/src/components/ColumnMenu.tsx`
- `packages/maita-table-react/src/components/FilterMenu.tsx`
- `packages/maita-table-react/src/hooks/useColumnSorting.ts`
- `packages/maita-table-react/src/hooks/useColumnFiltering.ts`

**修改文件**：
- `packages/maita-table-core/src/column.ts`（扩展 ColumnMeta）
- `packages/maita-table-react/src/DataGrid.tsx`（重构列头渲染，使用新组件）

### 新增依赖
- **无需新增依赖**！所有需要的库都已安装：
  - ✅ `@tanstack/react-table` - 提供排序、过滤功能（`getSortedRowModel`, `getFilteredRowModel`）
  - ✅ `@radix-ui/react-popover` - 提供浮动层定位（底层使用 @floating-ui/react，自动处理定位和碰撞检测）
  - ✅ `@tanstack/react-virtual` - 提供虚拟化（已在使用）
  - ✅ shadcn/ui 组件 - Popover, Input, Select 等

## 实施策略

1. **先重构列头**（阶段 1）：
   - 拆分组件，降低 `DataGrid.tsx` 复杂度
   - 为后续功能打好基础

2. **再实现过滤**（阶段 2）：
   - 浮动过滤提升用户体验
   - 基础过滤菜单增强过滤能力

## 验收标准

1. ✅ 列头组件拆分完成，`DataGrid.tsx` 代码行数减少 30%+
2. ✅ 支持多列排序，排序状态可视化
3. ✅ 浮动过滤器正常工作，防抖优化生效
4. ✅ 基础过滤菜单支持文本、数字、日期过滤
5. ✅ 所有功能通过列属性（meta）控制
6. ✅ 性能测试：1000+ 行数据下流畅操作

## 参考

- [AG Grid Examples](https://ag-grid.com/example/)
- [AG Grid Set Filter](https://www.ag-grid.com/react-data-grid/filter-set-filter/)
- [AG Grid Grouping](https://www.ag-grid.com/react-data-grid/grouping/)
- [AG Grid Aggregation](https://www.ag-grid.com/react-data-grid/aggregation/)
