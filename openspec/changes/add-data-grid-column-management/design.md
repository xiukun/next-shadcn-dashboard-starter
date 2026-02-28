# 列管理能力技术设计

## 上下文

当前 `data-grid` 基于：
- `@tanstack/react-table` 作为表格状态管理
- `@tanstack/react-virtual` 作为行虚拟化引擎
- `@maita-table/core` 作为内核（列配置、状态、校验）
- Zustand 作为运行时状态存储

需要新增的能力：
1. 列管理面板（可视化配置界面）
2. 列虚拟化（水平方向）
3. Pinned 列布局（左右固定）

## 目标 / 非目标

### 目标
- 支持 50+ 列的流畅滚动（通过列虚拟化）
- 支持左右固定列，滚动时保持可见
- 提供完整的列管理 UI，用户无需修改代码即可调整列配置
- 列配置状态可持久化，下次打开自动恢复

### 非目标
- 本次不实现 Selection 模型（单选/多选/范围选择）
- 不实现列分组（grouping）功能
- 不实现列筛选 UI（filtering UI，仅支持状态管理）

## 决策

### 决策 1：列状态存储位置

**选择**：在 `DataGridViewState` 中扩展列状态，而非在 `ColumnConfig` 中直接修改。

**理由**：
- `ColumnConfig` 是"源配置"，不应被运行时状态污染
- `DataGridViewState` 是"视图状态"，适合存储用户偏好
- 分离关注点：配置 vs 视图状态

**实现**：
```typescript
export interface DataGridViewState<Row = any> {
  // ... 现有字段
  /**
   * 列顺序（覆盖 columns 的顺序）
   */
  columnsOrder?: string[];
  /**
   * 列宽度映射（columnId -> width）
   */
  columnsWidth?: Record<string, number>;
  /**
   * 列可见性映射（columnId -> visible）
   */
  columnsVisibility?: Record<string, boolean>;
  /**
   * 列固定位置映射（columnId -> 'left' | 'right' | undefined）
   */
  columnsPinned?: Record<string, 'left' | 'right'>;
}
```

### 决策 2：列虚拟化策略

**选择**：使用 `@tanstack/react-virtual` 的水平虚拟化，而非自研虚拟化引擎。

**理由**：
- 项目已使用 `@tanstack/react-virtual` 做行虚拟化，保持技术栈一致
- 该库支持水平虚拟化（`horizontal` 选项）
- 社区成熟，性能经过验证

**实现**：
```typescript
const columnVirtualizer = useVirtualizer({
  count: visibleColumns.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: (index) => columnsWidth[visibleColumns[index].id] || defaultWidth,
  horizontal: true, // 水平虚拟化
  overscan: 5
});
```

**考虑的替代方案**：
- 自研虚拟化引擎：性能可能更好，但开发成本高，维护负担重
- 不虚拟化：简单，但在 50+ 列时性能差

### 决策 3：Pinned 列布局结构

**选择**：使用三个独立的 `<table>` 元素，而非单个 table + CSS sticky。

**理由**：
- 三个 table 可以独立虚拟化（中间区域虚拟化，左右固定区不虚拟化）
- 避免单个 table 中 sticky 列与虚拟化列的复杂交互
- 更清晰的 DOM 结构，便于维护

**布局结构**：
```
<div className="grid-container">
  <div className="grid-header">
    <table className="pinned-left">...</table>
    <table className="scrollable-center">...</table>
    <table className="pinned-right">...</table>
  </div>
  <div className="grid-body" ref={scrollContainerRef}>
    <table className="pinned-left">...</table>
    <div className="scrollable-center">
      {/* 虚拟化行 + 虚拟化列 */}
    </div>
    <table className="pinned-right">...</table>
  </div>
</div>
```

**考虑的替代方案**：
- 单个 table + CSS sticky：实现简单，但虚拟化复杂
- 使用 CSS Grid：布局灵活，但浏览器兼容性需考虑

### 决策 4：列宽自动调整算法

**选择**：仅测量当前可见行的内容宽度，而非全量扫描。

**理由**：
- 虚拟化场景下，全量扫描成本高（需要渲染所有行）
- 当前可见行已足够代表"典型内容宽度"
- 用户可以通过手动调整微调

**实现**：
```typescript
function measureColumnWidth(
  columnId: string,
  visibleRows: Row[],
  headerElement: HTMLElement
): number {
  const headerWidth = headerElement.offsetWidth;
  let maxCellWidth = 0;
  
  // 仅测量可见行
  visibleRows.forEach(row => {
    const cell = getCellElement(row.id, columnId);
    if (cell) {
      maxCellWidth = Math.max(maxCellWidth, cell.scrollWidth);
    }
  });
  
  return Math.max(headerWidth, maxCellWidth) + padding;
}
```

**考虑的替代方案**：
- 全量扫描：精确但慢
- 采样测量（每 N 行测一次）：折中方案，但实现复杂

### 决策 5：列管理面板 UI 框架

**选择**：使用 shadcn/ui 的 `Drawer` 组件，而非自定义 Modal。

**理由**：
- 项目已使用 shadcn/ui，保持 UI 一致性
- `Drawer` 适合移动端和桌面端
- 减少自定义样式维护成本

**考虑的替代方案**：
- Popover：轻量，但空间有限，不适合复杂配置
- Sheet：类似 Drawer，但语义更偏向"侧边栏"

## 风险 / 权衡

### 风险 1：三个 table 的同步滚动复杂度

**风险**：三个 table 需要同步滚动，可能出现不同步的情况。

**缓解措施**：
- 使用统一的 `scrollLeft` 状态
- 监听滚动事件，统一更新三个区域的滚动位置
- 添加防抖，避免频繁更新

### 风险 2：列虚拟化与行虚拟化的组合复杂度

**风险**：行虚拟化 + 列虚拟化 = 二维虚拟化，实现复杂。

**缓解措施**：
- 先实现列虚拟化，再集成行虚拟化
- 使用 `@tanstack/react-virtual` 的官方示例作为参考
- 分阶段测试，确保每一步都稳定

### 风险 3：Pinned 列与拖拽重排的交互冲突

**风险**：用户拖拽列时，可能跨越 pinned 边界，需要特殊处理。

**缓解措施**：
- 限制拖拽范围：左固定区只能内部重排，右固定区只能内部重排，中间区可以跨区
- 提供明确的视觉反馈（拖拽时的占位符）
- 在列管理面板中提供"移动到固定区"的明确操作

### 权衡：性能 vs 开发成本

- **列虚拟化**：开发成本高，但性能收益大（50+ 列场景）
- **Pinned 列**：开发成本中等，用户体验收益大
- **列管理面板**：开发成本低，用户价值高

**策略**：先实现列管理面板（快速交付价值），再实现列虚拟化（性能优化）。

## 迁移计划

### 阶段 1：列管理面板（不破坏性）

1. 扩展 `DataGridViewState`（向后兼容，新字段可选）
2. 创建列管理面板组件
3. 在现有 `DataGrid` 中添加入口按钮
4. 用户可以选择使用或不使用列管理功能

### 阶段 2：列虚拟化 + Pinned（可选启用）

1. 添加 `enableColumnVirtualization` prop（默认 false）
2. 实现列虚拟化引擎
3. 实现 Pinned 布局
4. 用户可以选择启用或禁用列虚拟化

### 向后兼容

- 现有 `ColumnConfig` 保持不变
- 现有 `DataGrid` API 保持不变
- 新功能通过可选 prop 启用
- 列状态持久化可选（通过 `enablePersistence` prop）

## 待决问题

1. **列虚拟化的阈值**：何时启用列虚拟化？20 列？30 列？
   - **建议**：默认 30 列，可通过 prop 配置

2. **Pinned 列的数量限制**：是否限制左右固定列的数量？
   - **建议**：不限制，但提供警告（固定列过多可能影响性能）

3. **列宽自动调整的精度**：是否需要考虑字体、padding 等因素？
   - **建议**：使用 `scrollWidth`（已包含 padding），字体通过 CSS 统一管理

4. **列管理面板的触发方式**：按钮位置？快捷键？
   - **建议**：表头右侧工具栏按钮，快捷键 `Cmd/Ctrl + K`（与全局搜索区分）
