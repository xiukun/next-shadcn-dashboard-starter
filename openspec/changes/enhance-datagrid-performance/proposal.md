# 变更：增强 DataGrid 性能优化

## 为什么

当前 DataGrid 组件在大数据量场景下存在性能瓶颈：
1. 只有行虚拟化，缺少列虚拟化，当列数 > 50 时横向滚动性能下降
2. 固定行高导致内容截断或空间浪费
3. 大数据集一次性加载导致卡顿
4. 滚动事件处理可能过于频繁

参考 ag-grid 的性能优化实践，我们需要增强虚拟化能力、优化渲染性能，以支持更大规模的数据展示。

## 变更内容

- **列虚拟化完善**：完善现有的 `useColumnVirtualization` hook，实现列虚拟化渲染
- **智能行高计算**：使用 `ResizeObserver` 测量实际行高，支持动态行高
- **增量数据加载**：支持分块加载数据，显示加载进度
- **滚动性能优化**：优化虚拟化 overscan 策略和滚动事件处理

## 影响

- **受影响规范**：`data-grid`（性能相关需求）
- **受影响代码**：
  - `packages/maita-table-react/src/hooks/useColumnVirtualization.ts`
  - `packages/maita-table-react/src/hooks/useTableVirtualization.ts`
  - `packages/maita-table-react/src/store/slices/dataSlice.ts`
  - `packages/maita-table-react/src/components/DataGridHeader.tsx`
  - `packages/maita-table-react/src/components/DataGridBody.tsx`
