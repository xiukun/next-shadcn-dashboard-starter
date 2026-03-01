# 需求核对清单

## Change ID
`refactor-datagrid-store-and-split-components`

## 验收标准

### 1. Store 重构验收标准
- [ ] ✅ Store 完全使用 Slice 模式，无 Controller 依赖
- [ ] ✅ 所有 hooks 使用 slice actions，不再使用 `setState`
- [ ] ✅ 类型安全完整，无类型错误
- [ ] ✅ 所有功能正常工作（排序、过滤、选择、编辑等）

### 2. 组件拆分验收标准
- [ ] ✅ `DataGrid.tsx` 代码行数减少到 200-300 行
- [ ] ✅ 所有子组件功能正常
- [ ] ✅ 代码可读性和可维护性提升

### 3. 分页功能验收标准
- [ ] ✅ 客户端分页模式正常工作
- [ ] ✅ 服务端分页模式正常工作
- [ ] ✅ 分页 UI 组件完整
- [ ] ✅ 分页状态持久化（可选）正常工作

### 4. 性能验收标准
- [ ] ✅ 性能测试：1000+ 行数据下流畅操作
- [ ] ✅ 无性能回归

## 文件列表

### 新增文件
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

### 修改文件
- `packages/maita-table-react/src/DataGrid.tsx` - 重构为主组件（200-300 行）
- `packages/maita-table-react/src/store.ts` - 移除，替换为新 store
- `packages/maita-table-react/src/useDataGrid.tsx` - 重构为使用新 store
- `packages/maita-table-react/src/hooks/useColumnSorting.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useColumnFiltering.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useRowSelection.ts` - 使用 slice actions
- `packages/maita-table-react/src/hooks/useTableSubmission.ts` - 使用 slice actions
- `packages/maita-table-react/src/components/SubmissionControls.tsx` - 使用新 store API

### 删除文件（可选）
- `packages/maita-table-core/src/controller.ts` - 如果其他地方不使用，可以删除

## 风险点

### 1. 状态迁移风险
- **风险**：从 Controller 模式迁移到 Slice 模式可能导致状态更新逻辑不一致
- **缓解**：充分测试所有功能，确保状态更新正确

### 2. 类型安全风险
- **风险**：重构过程中可能破坏类型安全
- **缓解**：使用 TypeScript 严格模式，确保所有类型正确

### 3. 性能风险
- **风险**：重构可能影响性能
- **缓解**：进行性能测试，确保无性能回归

### 4. 向后兼容风险
- **风险**：虽然不考虑向后兼容，但需要确保所有使用 DataGrid 的地方正常工作
- **缓解**：更新所有使用 DataGrid 的地方（如有）

### 5. 测试覆盖风险
- **风险**：重构后测试覆盖可能不足
- **缓解**：为所有新组件和 hooks 添加单元测试

## 实施顺序

1. **阶段 1**：创建新的 Store 结构（Zustand Slice 模式）
2. **阶段 2**：重构现有 Hooks 使用 Slice Actions
3. **阶段 3**：创建新的 Hooks
4. **阶段 4**：拆分渲染组件
5. **阶段 5**：创建分页组件
6. **阶段 6**：重构主组件
7. **阶段 7**：验证与收尾
