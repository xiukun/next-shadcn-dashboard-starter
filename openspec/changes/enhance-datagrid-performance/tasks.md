## 1. 实施

### 1.1 列虚拟化完善
- [ ] 完善 `useColumnVirtualization` hook 实现
- [ ] 集成列虚拟化到 `DataGridHeader` 组件
- [ ] 处理固定列（pinned columns）与虚拟化的兼容
- [ ] 添加列虚拟化测试

### 1.2 智能行高计算
- [ ] 创建 `useDynamicRowHeight` hook
- [ ] 使用 `ResizeObserver` 测量行高
- [ ] 缓存行高到 `runtimeSlice`
- [ ] 更新 `useTableVirtualization` 使用动态行高
- [ ] 添加动态行高测试

### 1.3 增量数据加载
- [ ] 在 `dataSlice` 中添加 `loadingChunks` 状态
- [ ] 创建 `useIncrementalLoading` hook
- [ ] 实现分块加载逻辑
- [ ] 添加加载进度显示组件
- [ ] 添加增量加载测试

### 1.4 滚动性能优化
- [ ] 优化虚拟化 overscan 策略（根据滚动速度动态调整）
- [ ] 使用 `useThrottle` 优化滚动事件处理
- [ ] 减少不必要的重渲染
- [ ] 添加性能测试

## 2. 测试

- [ ] 列虚拟化功能测试（50+ 列场景）
- [ ] 动态行高功能测试
- [ ] 增量加载功能测试
- [ ] 滚动性能基准测试（10,000+ 行）
- [ ] 集成测试

## 3. 文档

- [ ] 更新 API 文档
- [ ] 添加性能优化使用示例
- [ ] 更新开发规则文档
