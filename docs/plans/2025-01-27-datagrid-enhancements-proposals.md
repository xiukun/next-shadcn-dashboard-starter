# DataGrid 组件库增强方案提案

## 当前功能概览

### 已实现功能
- ✅ 虚拟化滚动（行虚拟化）
- ✅ 排序（多列排序）
- ✅ 过滤（列过滤）
- ✅ 分页（客户端/服务端）
- ✅ 行选择（单选/多选）
- ✅ 单元格编辑（immediate/single-row/batch）
- ✅ 列管理（显示/隐藏、排序、固定、宽度）
- ✅ 状态持久化（列、选择、分页）
- ✅ 列宽调整
- ✅ 验证（Zod Schema）

### 对比 ag-grid 特性

参考 ag-grid 的核心特性：
- **Performance**: 高性能大数据渲染
- **Finance Grid**: 金融数据展示（格式化、聚合）
- **HR Grid**: 人力资源场景（分组、展开）
- **Inventory Grid**: 库存管理（批量操作、导出）

---

## 方案一：性能与大数据优化（高优先级）

### 目标
提升大数据场景下的渲染性能和用户体验

### 新功能

#### 1.1 列虚拟化（Column Virtualization）
**问题**：当前只有行虚拟化，当列数 > 50 时横向滚动性能下降

**实现**：
- 创建 `useColumnVirtualization` hook（已有基础实现）
- 只渲染可见列 + overscan 列
- 优化横向滚动性能

**技术要点**：
```typescript
// hooks/useColumnVirtualization.ts 已存在，需要完善
export function useColumnVirtualization(options: {
  visibleColumns: Column[];
  containerWidth: number;
  scrollLeft: number;
  overscan?: number;
}): {
  virtualColumns: VirtualColumn[];
  paddingLeft: number;
  paddingRight: number;
}
```

#### 1.2 增量数据加载（Incremental Loading）
**问题**：大数据集一次性加载导致卡顿

**实现**：
- 在 `dataSlice` 中添加 `loadingChunks` 状态
- 支持分块加载数据
- 显示加载进度

**技术要点**：
```typescript
// store/slices/dataSlice.ts 扩展
interface DataSlice {
  loadingChunks: {
    chunkIndex: number;
    totalChunks: number;
    loadedRows: number;
  };
  setLoadingChunks: (chunks: LoadingChunks) => void;
}
```

#### 1.3 智能行高计算（Dynamic Row Height）
**问题**：固定行高导致内容截断或空间浪费

**实现**：
- 使用 `ResizeObserver` 测量实际行高
- 缓存行高到 `runtimeSlice`
- 虚拟化时使用实际高度

**技术要点**：
```typescript
// hooks/useDynamicRowHeight.ts (新建)
export function useDynamicRowHeight(options: {
  rows: Row[];
  virtualizer: Virtualizer;
  defaultHeight: number;
}): {
  rowHeights: Map<RowKey, number>;
  getRowHeight: (rowKey: RowKey) => number;
}
```

### 优化功能

#### 1.4 优化虚拟化 overscan
**当前**：固定 overscan = 12

**优化**：
- 根据滚动速度动态调整 overscan
- 快速滚动时增加 overscan，慢速时减少

#### 1.5 防抖滚动事件
**当前**：滚动事件可能过于频繁

**优化**：
- 使用 `useThrottle` hook（已存在）优化滚动处理
- 减少不必要的重渲染

---

## 方案二：高级数据操作（中优先级）

### 目标
提供企业级数据表格的常用操作功能

### 新功能

#### 2.1 行分组（Row Grouping）
**参考**：ag-grid HR Grid 特性

**实现**：
- 在 `viewSlice` 中添加 `groupBy` 状态（已存在但未实现）
- 创建 `useRowGrouping` hook
- 支持多级分组
- 显示分组展开/折叠按钮

**技术要点**：
```typescript
// hooks/useRowGrouping.ts (新建)
export function useRowGrouping(options: {
  store: DataGridStore<Row>;
  groupByColumns: string[];
}): {
  groupedRows: GroupedRow<Row>[];
  toggleGroup: (groupId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}
```

#### 2.2 数据聚合（Aggregation）
**参考**：ag-grid Finance Grid 特性

**实现**：
- 支持分组行的聚合计算（sum, avg, count, min, max）
- 在分组行显示聚合结果
- 可配置聚合函数

**技术要点**：
```typescript
// hooks/useRowAggregation.ts (新建)
export function useRowAggregation(options: {
  groupedRows: GroupedRow<Row>[];
  columns: ColumnConfig<Row>[];
  aggregations: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>;
}): {
  aggregatedData: Record<string, number>;
}
```

#### 2.3 数据导出（Export）
**参考**：ag-grid Inventory Grid 特性

**实现**：
- 支持导出 CSV、Excel（使用 xlsx 库）
- 支持导出当前页或全部数据
- 支持导出时包含/排除列

**技术要点**：
```typescript
// hooks/useDataExport.ts (新建)
export function useDataExport(options: {
  rows: Row[];
  columns: ColumnConfig<Row>[];
  filename: string;
}): {
  exportToCSV: () => void;
  exportToExcel: () => void;
  exportToJSON: () => void;
}
```

#### 2.4 批量操作（Bulk Actions）
**参考**：ag-grid Inventory Grid 特性

**实现**：
- 选中多行后显示批量操作工具栏
- 支持批量删除、批量更新、批量导出
- 操作确认对话框

**技术要点**：
```typescript
// components/BulkActionsToolbar.tsx (新建)
export function BulkActionsToolbar<Row>(props: {
  selectedRows: Row[];
  onBulkDelete: () => void;
  onBulkUpdate: (updates: Partial<Row>[]) => void;
  onBulkExport: () => void;
})
```

### 优化功能

#### 2.5 优化过滤性能
**当前**：大数据集过滤可能卡顿

**优化**：
- 使用 Web Worker 进行过滤计算
- 或使用 `useMemo` 优化过滤结果缓存

---

## 方案三：用户体验增强（中优先级）

### 目标
提升用户交互体验和操作效率

### 新功能

#### 3.1 键盘导航增强
**当前**：基础的可编辑单元格导航

**增强**：
- 支持方向键、Tab、Enter 导航
- 支持 Ctrl/Cmd + 方向键快速跳转
- 支持 Ctrl/Cmd + A 全选
- 支持 Delete/Backspace 删除内容

**技术要点**：
```typescript
// hooks/useKeyboardNavigation.ts (新建)
export function useKeyboardNavigation(options: {
  table: Table<Row>;
  store: DataGridStore<Row>;
  onCellFocus: (rowIndex: number, columnIndex: number) => void;
}): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
}
```

#### 3.2 拖拽排序（Drag & Drop Rows）
**参考**：常见表格需求

**实现**：
- 使用 `@dnd-kit/core`（项目已使用）
- 支持拖拽行重新排序
- 显示拖拽预览

**技术要点**：
```typescript
// hooks/useRowDragAndDrop.ts (新建)
export function useRowDragAndDrop(options: {
  rows: Row[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}): {
  dragHandlers: DragHandlers;
}
```

#### 3.3 列拖拽排序（Column Drag & Drop）
**当前**：列管理面板支持排序，但不直观

**增强**：
- 表头支持拖拽排序
- 实时预览列位置
- 保存到列状态持久化

#### 3.4 快速搜索（Quick Search）
**参考**：ag-grid 全局搜索

**实现**：
- 表格顶部添加搜索框
- 高亮匹配文本
- 支持正则表达式（可选）

**技术要点**：
```typescript
// components/QuickSearch.tsx (新建)
export function QuickSearch<Row>(props: {
  onSearch: (query: string) => void;
  placeholder?: string;
})
```

#### 3.5 行内操作菜单（Row Actions Menu）
**参考**：常见表格需求

**实现**：
- 每行右侧显示操作按钮（编辑、删除、复制等）
- 点击显示下拉菜单
- 可配置操作项

**技术要点**：
```typescript
// components/RowActionsMenu.tsx (新建)
export function RowActionsMenu<Row>(props: {
  row: Row;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: Row) => void;
    disabled?: boolean;
  }>;
})
```

### 优化功能

#### 3.6 优化加载状态
**当前**：可能缺少加载指示器

**优化**：
- 数据加载时显示骨架屏
- 分页切换时显示加载动画
- 错误状态友好提示

#### 3.7 优化空状态
**当前**：可能缺少空状态提示

**优化**：
- 无数据时显示友好提示
- 过滤无结果时显示提示
- 可配置空状态内容

---

## 方案四：高级格式化与展示（低优先级）

### 目标
提供专业的数据展示能力

### 新功能

#### 4.1 条件格式化（Conditional Formatting）
**参考**：ag-grid Finance Grid 特性

**实现**：
- 支持基于值的单元格样式
- 支持数据条（data bars）
- 支持图标集（icon sets）

**技术要点**：
```typescript
// hooks/useConditionalFormatting.ts (新建)
export function useConditionalFormatting(options: {
  rules: Array<{
    column: string;
    condition: (value: any) => boolean;
    style: React.CSSProperties;
  }>;
}): {
  getCellStyle: (row: Row, column: string) => React.CSSProperties;
}
```

#### 4.2 单元格渲染器扩展
**当前**：已有 text、number、checkbox 单元格

**扩展**：
- 日期单元格（DateCell）
- 图片单元格（ImageCell）
- 链接单元格（LinkCell）
- 标签单元格（TagCell）
- 进度条单元格（ProgressCell）

#### 4.3 列固定增强
**当前**：支持左右固定

**增强**：
- 支持中间列固定（pinned center）
- 固定列阴影效果
- 固定列数量限制提示

#### 4.4 表格主题与样式
**当前**：基础样式

**增强**：
- 支持紧凑/舒适/宽松密度（已有 density）
- 支持斑马纹（zebra striping）
- 支持行悬停高亮
- 支持自定义主题

---

## 方案五：可访问性与国际化（中优先级）

### 目标
提升可访问性和国际化支持

### 新功能

#### 5.1 ARIA 属性完善
**当前**：部分 ARIA 属性可能缺失

**完善**：
- 所有交互元素添加 ARIA 标签
- 表格角色和区域标识
- 键盘导航提示

#### 5.2 屏幕阅读器支持
**实现**：
- 行/列位置提示
- 排序/过滤状态提示
- 选择状态提示

#### 5.3 国际化（i18n）支持
**当前**：部分文本硬编码

**实现**：
- 所有文本使用翻译键
- 支持日期/数字格式化
- 支持 RTL 布局（可选）

---

## 推荐实施顺序

### 第一阶段（性能优化）
1. ✅ 列虚拟化完善
2. ✅ 智能行高计算
3. ✅ 防抖滚动事件优化

### 第二阶段（核心功能）
4. ✅ 行分组
5. ✅ 数据聚合
6. ✅ 数据导出

### 第三阶段（用户体验）
7. ✅ 键盘导航增强
8. ✅ 快速搜索
9. ✅ 行内操作菜单

### 第四阶段（高级功能）
10. ✅ 条件格式化
11. ✅ 单元格渲染器扩展
12. ✅ 拖拽排序

---

## 技术债务与优化

### 代码质量
- [ ] 统一错误处理机制
- [ ] 添加性能监控（Performance API）
- [ ] 完善 TypeScript 类型定义
- [ ] 增加单元测试覆盖率

### 文档
- [ ] API 文档完善
- [ ] 使用示例和最佳实践
- [ ] 迁移指南（如果有破坏性变更）

### 性能基准
- [ ] 建立性能测试基准
- [ ] 10,000 行数据渲染时间 < 100ms
- [ ] 100,000 行数据虚拟化流畅滚动
- [ ] 50+ 列横向滚动流畅

---

## 总结

基于 ag-grid 的特性对比和当前 DataGrid 的实现，建议优先实施：

1. **性能优化**（方案一）：列虚拟化、智能行高、增量加载
2. **核心功能**（方案二）：行分组、数据聚合、数据导出
3. **用户体验**（方案三）：键盘导航、快速搜索、行操作菜单

这些功能将显著提升 DataGrid 在企业级应用中的竞争力。
