# 实施任务清单

## Change ID

`20260217141519-refactor-tabs-navigation`

## 任务列表

### 阶段 1: 状态管理基础

- [x] 1.1 创建 `src/stores/route-tabs-store.ts`，使用 Zustand 定义标签页状态管理
- [x] 1.2 定义 `RouteTab` 接口（id, title, url, icon, closable）
- [x] 1.3 实现 `addTab`, `removeTab`, `setActiveTab`, `closeOtherTabs`, `closeAllTabs`, `hasTab` 方法
- [x] 1.4 添加默认标签页（`/dashboard/overview`）初始化逻辑
- [x] 1.5 实现标签页数量限制（最多 8 个可关闭的标签页）
- [x] 1.6 使用 Zustand persist 中间件实现状态持久化（skipHydration: true）

### 阶段 2: React Hook 封装

- [x] 2.1 创建 `src/hooks/use-route-tabs.ts` Hook
- [x] 2.2 使用 `usePathname()` 和 `useRouter()` 监听路由变化
- [x] 2.3 实现路由变化时自动创建/激活 Tab 的逻辑
- [x] 2.4 从 `nav-config.ts` 读取菜单项信息（标题、图标）用于创建 Tab
- [x] 2.5 实现 `findNavItemByUrl` 递归查找导航配置
- [x] 2.6 实现 `switchToTab` 函数用于切换路由

### 阶段 3: Tabs UI 组件

- [x] 3.1 创建 `src/components/layout/route-tabs.tsx` 组件
- [x] 3.2 实现 `TabItem` 子组件，显示标题、图标、关闭按钮
- [x] 3.3 实现分离的测量容器（隐藏容器用于测量 tab 宽度）
- [x] 3.4 实现智能可见性计算算法（确保激活 tab 可见，向左右扩展）
- [x] 3.5 实现溢出下拉菜单（`OverflowDropdown` 组件）
- [x] 3.6 添加 Tab 点击切换路由功能
- [x] 3.7 实现 Tab 激活状态样式（高亮当前路由对应的 Tab）
- [x] 3.8 使用 `ResizeObserver` 监听容器尺寸变化
- [x] 3.9 实现防抖处理避免频繁计算

### 阶段 4: 右键菜单功能

- [x] 4.1 使用 shadcn/ui 的 `ContextMenu` 组件
- [x] 4.2 实现右键菜单显示逻辑（关闭当前/其他/全部）
- [x] 4.3 实现 `closeOtherTabs` 功能（保留当前 tab 和不可关闭的 tabs）
- [x] 4.4 实现 `closeAllTabs` 功能（保留不可关闭的 tabs，如果没有则添加默认 tab）
- [x] 4.5 处理最后一个标签页关闭时的边界情况（自动跳转到默认路由）
- [x] 4.6 实现关闭按钮 hover 显示逻辑

### 阶段 5: 布局集成

- [x] 5.1 修改 `src/components/layout/header.tsx`，在 Header 内部集成 `<RouteTabs />`，替换 Breadcrumbs
- [x] 5.2 使用 CSS Grid `grid-cols-[1fr_auto]` 布局确保右侧按钮不被压缩
- [x] 5.3 实现右侧按钮宽度测量（使用 `ResizeObserver`）
- [x] 5.4 动态调整 Tabs 容器最大宽度（`calc(100vw - ${rightActionsWidth}px - 4rem)`）
- [x] 5.5 优化 SearchInput 为图标按钮
- [x] 5.6 优化 ThemeSelector 为图标下拉菜单
- [x] 5.7 删除未使用的 `cta-github.tsx` 组件

### 阶段 6: 样式优化

- [x] 6.1 优化 Tab 样式，与现有设计系统保持一致
- [x] 6.2 实现 Tab 激活状态的视觉反馈（`bg-muted` 背景色）
- [x] 6.3 添加 `scrollbar-hide` 工具类到 `globals.css`（隐藏滚动条但保持滚动功能）
- [x] 6.4 实现关闭按钮 hover 显示（`opacity-0 group-hover:opacity-100`）
- [x] 6.5 优化 Tab 间距和 padding

### 阶段 7: 状态持久化（可选）

- [x] 7.1 使用 Zustand persist 中间件保存已打开的标签页到 localStorage
- [x] 7.2 页面刷新后恢复标签页状态（使用 `skipHydration: true` 避免 SSR 不匹配）
- [x] 7.3 在组件中手动触发 hydration（`useRouteTabsStore.persist.rehydrate()`）

### 阶段 8: 测试和验证

- [x] 8.1 测试点击侧边栏菜单项创建 Tab
- [x] 8.2 测试点击 Tab 切换路由
- [x] 8.3 测试右键菜单关闭功能（关闭当前/其他/全部）
- [x] 8.4 测试标签页溢出时的智能显示（激活 tab 始终可见）
- [x] 8.5 测试关闭最后一个标签页的边界情况（自动跳转到默认路由）
- [x] 8.6 测试标签页数量限制（最多 8 个可关闭的标签页）
- [x] 8.7 测试 Header 布局（右侧按钮不被压缩）
- [x] 8.8 运行类型检查（`pnpm exec tsc --noEmit`）
- [x] 8.9 运行 lint 检查（`pnpm run lint`）
- [x] 8.10 运行格式化检查（`pnpm run format`）

## 实施顺序

按阶段顺序执行，每个阶段完成后进行验证。

## 技术细节

### 路由同步逻辑

```typescript
// 在 use-route-tabs.ts 中
useEffect(() => {
  const pathname = usePathname();
  const navItem = findNavItemByUrl(pathname); // 从 nav-config 查找

  if (navItem) {
    const tab: RouteTab = {
      id: pathname,
      title: navItem.title,
      url: pathname,
      icon: navItem.icon,
      closable: pathname !== '/dashboard/overview' // 默认页不可关闭
    };

    addTab(tab);
    setActiveTab(pathname);
  }
}, [pathname]);
```

### 溢出处理

使用 CSS 实现横向滚动：

```css
.tabs-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-scroll-container::-webkit-scrollbar {
  display: none;
}
```

## 完成总结

所有任务已完成：

- ✅ 创建 Zustand store (`src/stores/route-tabs-store.ts`) 管理标签页状态
  - 实现标签页数量限制（最多 8 个可关闭的标签页）
  - 使用 persist 中间件实现状态持久化
- ✅ 创建 `use-route-tabs` Hook (`src/hooks/use-route-tabs.ts`) 封装路由同步逻辑
  - 监听路由变化自动创建/激活 Tab
  - 从 nav-config 读取菜单项信息
- ✅ 创建 `RouteTabs` 组件 (`src/components/layout/route-tabs.tsx`) 实现 UI
  - 分离测量容器 + 智能可见性计算算法
  - 溢出下拉菜单显示隐藏的 tabs
  - 确保激活 tab 始终可见
- ✅ 实现右键菜单功能（关闭当前/其他/全部）
- ✅ 集成到 Header (`src/components/layout/header.tsx`)
  - 替换 Breadcrumbs
  - 使用 CSS Grid 布局确保右侧按钮不被压缩
- ✅ 优化 UI 组件
  - SearchInput 改为图标按钮
  - ThemeSelector 改为图标下拉菜单
- ✅ 添加滚动条隐藏样式到 `globals.css`
- ✅ 所有代码已格式化，TypeScript 类型检查通过，lint 检查通过

**实施日期**: 2026-02-17

**变更文件**:

- 新增: `src/stores/route-tabs-store.ts`
- 新增: `src/hooks/use-route-tabs.ts`
- 新增: `src/components/layout/route-tabs.tsx`
- 修改: `src/components/layout/header.tsx`
- 修改: `src/components/search-input.tsx`
- 修改: `src/components/themes/theme-selector.tsx`
- 修改: `src/styles/globals.css`
- 删除: `src/components/layout/cta-github.tsx`