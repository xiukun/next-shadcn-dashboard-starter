# 变更提案：实现路由 Tabs 多页签导航系统

## Change ID

`20260217141519-refactor-tabs-navigation`

## 问题描述

当前框架缺少多页签（Tabs）导航功能，用户每次切换路由都会替换整个页面内容，无法：

1. **多页面并行访问**：无法同时打开多个路由页面进行对比或快速切换
2. **快速关闭页面**：无法通过右键菜单快速关闭不需要的标签页
3. **标签页溢出处理**：当打开的标签页过多时，没有滚动或下拉菜单来管理

## 目标

实现一个优雅、简洁的路由 Tabs 多页签导航系统，支持：

1. **路由自动同步**：点击侧边栏菜单项时，自动在 Header 区域创建/激活对应的 Tab
2. **右键关闭功能**：右键点击 Tab 显示上下文菜单，支持关闭当前/其他/全部标签页
3. **溢出处理**：当标签页过多时，支持横向滚动或右侧下拉菜单显示剩余标签
4. **状态持久化**：刷新页面后保持已打开的标签页状态（可选，使用 localStorage）
5. **最小侵入性**：不影响现有路由和布局结构，仅在 Header 下方添加 Tabs 组件

## 影响范围

### 修改文件

- `src/components/layout/header.tsx` - **集成 Tabs 组件到 Header 内部，替换 Breadcrumbs**，使用 CSS Grid 布局确保右侧按钮不被压缩
- `src/components/search-input.tsx` - **改为图标按钮**，使用 Tooltip 显示快捷键提示
- `src/components/themes/theme-selector.tsx` - **改为图标下拉菜单**，使用 DropdownMenu 替代 Select
- `src/styles/globals.css` - 添加 `scrollbar-hide` 工具类用于隐藏滚动条

### 新增文件

- `src/components/layout/route-tabs.tsx` - 核心 Tabs 组件，实现标签页显示、溢出处理、右键菜单
- `src/hooks/use-route-tabs.ts` - 管理标签页状态的 React Hook，监听路由变化自动创建/激活 Tab
- `src/lib/route-tabs-store.ts` - 标签页状态管理（使用 Zustand + persist 中间件）

### 删除文件

- `src/components/layout/cta-github.tsx` - 删除未使用的组件

## 技术方案

### 1. 状态管理架构

使用 **Zustand**（项目已有）管理标签页状态：

```typescript
interface RouteTab {
  id: string; // 路由路径作为唯一ID
  title: string; // 显示标题
  url: string; // 路由路径
  icon?: string; // 图标名称
  closable?: boolean; // 是否可关闭（默认 true）
}

interface RouteTabsStore {
  tabs: RouteTab[];
  activeTabId: string | null;
  addTab: (tab: RouteTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
}
```

### 2. 路由同步机制

- **监听路由变化**：使用 Next.js `usePathname()` 和 `useRouter()` 监听路由变化
- **自动创建 Tab**：当路由变化且该路由不在 tabs 列表中时，自动创建新 Tab
- **激活对应 Tab**：路由变化时，自动激活对应的 Tab

### 3. UI 组件设计

#### RouteTabs 组件结构

```
<RouteTabsContainer>
  <TabsScrollArea>  {/* 支持横向滚动 */}
    <TabsList>
      {tabs.map(tab => (
        <TabItem
          key={tab.id}
          tab={tab}
          onContextMenu={showContextMenu}  {/* 右键菜单 */}
        />
      ))}
    </TabsList>
  </TabsScrollArea>
  {tabs.length > maxVisible && (
    <TabsDropdownMenu>  {/* 溢出时显示下拉菜单 */}
      {/* 显示隐藏的标签页 */}
    </TabsDropdownMenu>
  )}
</RouteTabsContainer>
```

#### 右键菜单功能

- 关闭当前标签页
- 关闭其他标签页
- 关闭全部标签页

### 4. 溢出处理策略

**实际实现**：采用**分离测量容器 + 智能可见性计算**的方案

**核心机制**：
1. **隐藏的测量容器**：所有 tabs 在隐藏容器中渲染，用于精确测量宽度
2. **智能可见性算法**：
   - 确保激活的 tab 始终可见
   - 从激活 tab 开始，向左右扩展，尽可能显示更多相邻 tabs
   - 优先添加右侧 tabs（更符合用户习惯）
3. **溢出下拉菜单**：当 tabs 溢出时，右侧显示下拉菜单，显示隐藏的 tabs
4. **标签页数量限制**：最多 8 个可关闭的标签页（默认 Dashboard 不占限额）

**技术实现**：
- 使用 `ResizeObserver` 监听容器尺寸变化
- 使用 `getBoundingClientRect()` 获取精确宽度
- 使用 `Map<string, number>` 存储每个 tab 的宽度
- 防抖处理避免频繁计算

### 5. 集成位置

**实际实现**：Tabs 集成在 `Header` 组件内部，替换了原有的 Breadcrumbs：

```tsx
<header className='grid grid-cols-[1fr_auto]'>
  {/* 左侧：SidebarTrigger + Separator + RouteTabs */}
  <div className='flex items-center overflow-hidden'>
    <SidebarTrigger />
    <Separator />
    <RouteTabs /> {/* 替换 Breadcrumbs */}
  </div>
  
  {/* 右侧：Search + User + Theme */}
  <div className='flex items-center gap-2'>
    <SearchInput /> {/* 图标按钮 */}
    <UserNav />
    <ThemeModeToggle />
    <ThemeSelector /> {/* 图标下拉菜单 */}
  </div>
</header>
```

**关键设计决策**：
- 使用 CSS Grid `grid-cols-[1fr_auto]` 确保右侧按钮区域不被压缩
- 左侧区域使用 `flex-1` 和 `overflow-hidden` 处理 Tabs 溢出
- 使用 `ResizeObserver` 实时测量右侧按钮宽度，动态调整 Tabs 容器最大宽度

## 验收标准

1. ✅ 点击侧边栏菜单项时，自动在 Header 中创建/激活对应的 Tab
2. ✅ Tab 显示正确的标题和图标（从 nav-config 读取）
3. ✅ 点击 Tab 可以切换到对应路由
4. ✅ 右键点击 Tab 显示上下文菜单，支持关闭当前/其他/全部功能
5. ✅ 当标签页过多时，使用智能算法计算可见 tabs，隐藏的显示在下拉菜单中
6. ✅ 激活的 tab 始终可见，不会被隐藏在下拉菜单中
7. ✅ 标签页数量限制：最多 8 个可关闭的标签页，默认 Dashboard 不占限额
8. ✅ 关闭最后一个标签页时，自动跳转到默认路由（`/dashboard/overview`）
9. ✅ 刷新页面后，已打开的标签页状态保持（使用 Zustand persist）
10. ✅ Header 布局优化：右侧按钮不被压缩，Search 和 Theme 改为图标显示
11. ✅ 不影响现有路由和布局功能
12. ✅ 代码简洁、类型安全、符合项目规范

## 风险与回滚

- **风险**：

  - 可能影响现有布局样式
  - 路由同步逻辑可能与其他导航功能冲突
  - 状态持久化可能影响首次访问体验

- **回滚策略**：
  - 使用 git revert 回退到上一个提交
  - 或通过特性开关（feature flag）控制是否启用 Tabs

## 实施计划

1. 创建 Zustand store 管理标签页状态
2. 创建 `use-route-tabs` Hook 封装状态逻辑
3. 创建 `RouteTabs` 组件实现 UI
4. 集成到 `Header` 下方
5. 实现右键菜单功能
6. 实现溢出滚动处理
7. 测试路由同步和关闭功能
8. 优化样式和交互体验

## 完成状态

✅ **已完成** - 2026-02-17

所有功能已实现并通过测试：

- ✅ 路由自动同步：点击侧边栏菜单项时自动创建/激活 Tab
- ✅ 右键关闭功能：支持关闭当前/其他/全部标签页
- ✅ 溢出处理：使用分离测量容器 + 智能可见性算法处理标签页溢出
- ✅ 标签页数量限制：最多 8 个可关闭的标签页，默认 Dashboard 不占限额
- ✅ 状态持久化：使用 Zustand persist 中间件保存状态到 localStorage（skipHydration: true）
- ✅ Header 布局优化：Tabs 集成在 Header 内部替换 Breadcrumbs，右侧按钮不被压缩
- ✅ UI 优化：Search 改为图标按钮，Theme 改为图标下拉菜单
- ✅ 最小侵入性：仅在 Header 中集成组件，不影响现有路由和布局功能
