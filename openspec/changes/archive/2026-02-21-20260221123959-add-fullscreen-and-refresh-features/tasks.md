# 实施任务清单

**变更 ID**: `20260221123959-add-fullscreen-and-refresh-features`  
**状态**: 已完成

## 任务列表

### 阶段 1: 图标添加

- [x] 1.1 在 icons.tsx 中添加全屏相关图标
  - 文件: `src/components/icons.tsx`
  - 导入 `IconMaximize` 和 `IconMinimize`（或 `IconArrowsMaximize` 和 `IconArrowsMinimize`）
  - 添加到 `Icons` 对象：`fullscreen` 和 `fullscreenExit`

- [x] 1.2 在 icons.tsx 中添加刷新图标
  - 文件: `src/components/icons.tsx`
  - 导入 `IconRefresh`（或 `IconRefreshDot`）
  - 添加到 `Icons` 对象：`refresh`

### 阶段 2: 全屏状态管理

- [x] 2.1 创建全屏状态管理 Store
  - 文件: `src/stores/fullscreen-store.ts`
  - 使用 Zustand 创建 Store
  - 定义接口：`isFullscreen: boolean`
  - 实现 `toggleFullscreen` 方法
  - 监听浏览器 `fullscreenchange` 事件，同步状态

- [x] 2.2 实现全屏切换逻辑
  - 文件: `src/stores/fullscreen-store.ts`
  - 使用 `document.documentElement.requestFullscreen()` 进入全屏
  - 使用 `document.exitFullscreen()` 退出全屏
  - 处理浏览器兼容性（webkit、moz、ms 前缀）

### 阶段 3: Header 全屏按钮

- [x] 3.1 在 Header 中添加全屏切换按钮
  - 文件: `src/components/layout/header.tsx`
  - 导入 `useFullscreenStore`
  - 在右侧按钮区域添加全屏按钮
  - 根据 `isFullscreen` 状态显示不同图标

- [x] 3.2 实现全屏按钮点击处理
  - 文件: `src/components/layout/header.tsx`
  - 绑定 `toggleFullscreen` 方法
  - 添加适当的 aria-label 和 tooltip

### 阶段 4: 布局全屏适配

- [x] 4.1 查找并修改 Dashboard 布局文件
  - 文件: `src/app/[locale]/dashboard/layout.tsx`（或相关布局文件）
  - 导入 `useFullscreenStore`
  - 根据 `isFullscreen` 状态条件渲染侧边栏

- [x] 4.2 实现全屏模式下的布局
  - 全屏模式下隐藏侧边栏（`<AppSidebar />`）
  - 全屏模式下保留 Header（Header 始终显示）
  - 确保内容区域占满剩余屏幕空间（Header 下方）

- [x] 4.3 调整全屏布局实现（保留 Header）
  - 修改 `FullscreenLayout` 组件，全屏模式下保留 Header 和内容区域
  - 只隐藏侧边栏和 InfoSidebar
  - 确保 Header 在全屏模式下正常显示和交互

### 阶段 5: 标签页刷新功能

- [x] 5.1 在 RouteTabs 组件中添加刷新按钮
  - 文件: `src/components/layout/route-tabs.tsx`
  - 在激活的标签页上添加刷新图标按钮
  - 刷新按钮仅在激活标签页上显示
  - 使用合适的图标和样式

- [x] 5.2 实现刷新逻辑
  - 文件: `src/components/layout/route-tabs.tsx`
  - 导入 Next.js `useRouter`
  - 实现刷新函数：使用 `router.refresh()` 或 `window.location.reload()`
  - 处理刷新时的加载状态（可选）

- [x] 5.3 优化刷新按钮交互
  - 添加 hover 效果
  - 添加点击反馈
  - 确保刷新按钮不影响标签页的点击和关闭功能

### 阶段 6: 样式和交互优化

- [ ] 6.1 全屏按钮样式优化
  - 确保全屏按钮与 Header 其他按钮样式一致
  - 添加适当的 hover 和 active 状态
  - 优化图标切换动画

- [ ] 6.2 刷新按钮样式优化
  - 确保刷新按钮与标签页样式协调
  - 添加适当的 hover 效果
  - 优化按钮位置和大小

- [ ] 6.3 全屏切换动画
  - 添加平滑的过渡动画
  - 确保布局切换无闪烁
  - 优化用户体验

### 阶段 7: 测试和验证

- [ ] 7.1 功能测试
  - 测试全屏按钮点击功能
  - 测试浏览器原生全屏快捷键（F11）状态同步
  - 测试标签页刷新功能
  - 测试全屏模式下的布局显示

- [ ] 7.2 边界情况测试
  - 测试不同浏览器中的全屏 API 兼容性
  - 测试全屏模式下刷新页面的行为
  - 测试快速切换全屏状态时的表现

- [ ] 7.3 响应式测试
  - 测试不同屏幕尺寸下的全屏模式
  - 测试移动端全屏功能（如果支持）

### 阶段 8: 文档和清理

- [ ] 8.1 代码注释
  - 为新增 Store 添加 JSDoc 注释
  - 为新增功能添加注释说明

- [ ] 8.2 类型检查
  - 确保 TypeScript 类型检查通过
  - 确保无 linter 错误

## 实施顺序

1. **阶段 1** → 添加图标
2. **阶段 2** → 创建全屏状态管理
3. **阶段 3** → 添加 Header 全屏按钮
4. **阶段 4** → 实现布局全屏适配
5. **阶段 5** → 实现标签页刷新功能
6. **阶段 6** → 样式和交互优化
7. **阶段 7** → 测试和验证
8. **阶段 8** → 文档和清理

## 注意事项

- 使用 TDD 方法：先写测试，再实现功能（如果项目有测试框架）
- 确保 SSR 兼容性：全屏状态管理需要考虑 SSR，使用 `skipHydration` 或客户端检查
- 浏览器兼容性：Fullscreen API 需要处理不同浏览器的前缀
- 保持代码风格一致：遵循项目现有的代码风格和约定
- 使用 TypeScript 严格模式：确保类型安全
