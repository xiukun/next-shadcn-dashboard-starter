# Code Review: 添加全屏功能和标签页刷新功能

## Change ID
`20260221123959-add-fullscreen-and-refresh-features`

## 审查范围
- 在 icons.tsx 中添加全屏和刷新图标
- 实现全屏功能（保留 Header，隐藏侧边栏）
- 实现标签页刷新功能

## 代码变更统计
- **修改文件**: 3 个文件
- **新增文件**: 3 个文件
- **新增代码行数**: 约 150 行

## 审查结果

### ✅ 通过项

1. **需求实现完整**
   - ✅ 正确添加了 `fullscreen`、`fullscreenExit`、`refresh` 三个图标
   - ✅ 全屏功能：Header 保留，侧边栏隐藏
   - ✅ 标签页刷新：仅在激活标签页显示刷新按钮
   - ✅ 浏览器 Fullscreen API 兼容性处理（webkit、moz、ms 前缀）

2. **实现质量**
   - ✅ Store 设计：`fullscreen-store.ts` 使用 Zustand，状态管理清晰
   - ✅ 事件监听：`initFullscreenListeners` 正确监听 fullscreenchange 事件
   - ✅ 清理机制：在 Header 的 useEffect 中正确返回 cleanup 函数
   - ✅ 布局适配：全屏模式下保留 SidebarProvider 确保 Header 的 SidebarTrigger 正常工作

3. **类型安全**
   - ✅ TypeScript 类型检查通过
   - ✅ 无 linter 错误

4. **边界情况处理**
   - ✅ SSR 兼容：`checkFullscreen` 检查 `typeof document !== 'undefined'`
   - ✅ 全屏布局中隐藏 Sidebar 但保留 SidebarProvider 上下文
   - ✅ 刷新按钮使用 `e.stopPropagation()` 避免触发标签页切换

5. **可访问性**
   - ✅ 全屏按钮有 `title` 和 `sr-only` 文本
   - ✅ 刷新按钮有 `title`、`role`、`tabIndex`、`onKeyDown` 支持键盘操作

### 📝 修改/新增的文件

1. **`src/components/icons.tsx`**
   - 导入 IconMaximize、IconMinimize、IconRefresh
   - 添加到 Icons 对象：fullscreen、fullscreenExit、refresh

2. **`src/stores/fullscreen-store.ts`**（新建）
   - 创建 useFullscreenStore
   - 实现 checkFullscreen、toggleFullscreen
   - 导出 initFullscreenListeners 用于事件监听

3. **`src/components/layout/header.tsx`**
   - 导入 useFullscreenStore、initFullscreenListeners
   - 在 useEffect 中调用 initFullscreenListeners 并返回 cleanup
   - 添加全屏切换按钮，根据 isFullscreen 显示不同图标

4. **`src/components/layout/fullscreen-layout.tsx`**（新建）
   - 根据 isFullscreen 条件渲染 fullLayout 或 fullscreenLayout
   - 全屏模式下使用 fixed 定位占满屏幕

5. **`src/app/[locale]/dashboard/layout.tsx`**
   - 创建 fullLayout 和 fullscreenLayout 两个布局
   - 全屏布局保留 SidebarProvider（Header 需 useSidebar）
   - 全屏布局中 AppSidebar 用 hidden 隐藏

6. **`src/components/layout/route-tabs.tsx`**
   - 导入 useRouter
   - 在 TabItem 中添加 handleRefresh 和刷新按钮
   - 刷新按钮仅在 isActive 时显示

### ⚠️ 注意事项

1. **全屏布局中的 Sidebar**
   - 使用 `<div className='hidden'><AppSidebar /></div>` 隐藏侧边栏
   - 保留 SidebarProvider 是因为 Header 的 SidebarTrigger 依赖 useSidebar

2. **initFullscreenListeners 清理**
   - 在 Header 的 useEffect 中正确返回 cleanup 函数
   - 组件卸载时移除事件监听器，避免内存泄漏

3. **router.refresh()**
   - 使用 Next.js 的 router.refresh() 进行软刷新
   - 相比 window.location.reload() 更轻量，保留客户端状态

4. **fullscreen-store 初始化**
   - `initialState` 在服务端为 false，客户端根据 checkFullscreen() 决定
   - 避免 SSR 时访问 document 导致错误

## 验收标准检查

- ✅ icons.tsx 中新增 fullscreen、fullscreenExit、refresh 图标
- ✅ Header 右侧显示全屏切换按钮
- ✅ 全屏模式下保留 Header，隐藏侧边栏
- ✅ 全屏按钮图标根据状态切换
- ✅ 激活的标签页上显示刷新按钮
- ✅ 点击刷新按钮刷新当前路由
- ✅ 浏览器原生全屏快捷键（F11）状态同步
- ✅ 无 linter 错误

## 风险评估

### 低风险
- 全屏状态管理简单，逻辑清晰
- 有完善的清理机制，不会导致内存泄漏
- 不影响正常的路由导航和 Tab 创建

### 回滚策略
如果出现问题，可以：
1. 从 git 历史恢复修改前的代码
2. 移除 fullscreen-store、fullscreen-layout 相关逻辑
3. 从 Header 和 route-tabs 中移除新增功能

## 审查结论

**✅ 审查通过**

所有变更符合要求：
- 需求实现完整
- 实现质量良好
- 类型安全
- 边界情况处理完善
- 可访问性考虑到位

可以安全归档到主规范。
