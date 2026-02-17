# 变更归档：路由 Tabs 多页签导航系统重构

## Change ID

`20260217141519-refactor-tabs-navigation`

## 归档日期

2025-02-17

## 变更摘要

成功实现路由 Tabs 多页签导航系统，集成到 Header 内部替换 Breadcrumbs，支持智能溢出处理、右键菜单关闭、标签页数量限制等功能。

## 实现成果

### 核心功能

1. **路由自动同步**
   - 点击侧边栏菜单项时，自动在 Header 中创建/激活对应的 Tab
   - 从 `nav-config.ts` 读取菜单项信息（标题、图标）
   - 支持递归查找子菜单项

2. **标签页管理**
   - 标签页数量限制：最多 8 个可关闭的标签页
   - 默认 Dashboard 标签页不占限额，始终存在且不可关闭
   - 超过限制时，自动替换最早的可关闭标签页

3. **智能溢出处理**
   - 分离测量容器：所有 tabs 在隐藏容器中渲染，用于精确测量宽度
   - 智能可见性算法：确保激活的 tab 始终可见，从激活 tab 向左右扩展
   - 溢出下拉菜单：隐藏的 tabs 显示在下拉菜单中

4. **右键菜单功能**
   - 关闭当前标签页
   - 关闭其他标签页（保留当前和不可关闭的）
   - 关闭全部标签页（保留不可关闭的）

5. **状态持久化**
   - 使用 Zustand persist 中间件保存到 localStorage
   - 使用 `skipHydration: true` 避免 SSR 不匹配
   - 页面刷新后恢复标签页状态

6. **Header 布局优化**
   - Tabs 集成在 Header 内部，替换 Breadcrumbs
   - 使用 CSS Grid `grid-cols-[1fr_auto]` 确保右侧按钮不被压缩
   - 使用 `ResizeObserver` 实时测量右侧按钮宽度
   - 动态调整 Tabs 容器最大宽度

7. **UI 组件优化**
   - SearchInput 改为图标按钮，使用 Tooltip 显示快捷键提示
   - ThemeSelector 改为图标下拉菜单，使用 DropdownMenu 替代 Select

### 文件变更清单

#### 新增文件
- ✅ `src/stores/route-tabs-store.ts` - Zustand store 管理标签页状态
- ✅ `src/hooks/use-route-tabs.ts` - React Hook 封装路由同步逻辑
- ✅ `src/components/layout/route-tabs.tsx` - Tabs UI 组件

#### 修改文件
- ✅ `src/components/layout/header.tsx` - 集成 RouteTabs，替换 Breadcrumbs
- ✅ `src/components/search-input.tsx` - 改为图标按钮
- ✅ `src/components/themes/theme-selector.tsx` - 改为图标下拉菜单
- ✅ `src/styles/globals.css` - 添加 `scrollbar-hide` 工具类

#### 删除文件
- ✅ `src/components/layout/cta-github.tsx` - 删除未使用的组件

### 技术实现亮点

1. **分离测量容器机制**
   - 隐藏容器用于测量所有 tab 的宽度
   - 显示容器只渲染可见的 tabs
   - 确保关闭按钮可以正常点击

2. **智能可见性算法**
   - 确保激活 tab 始终可见
   - 从激活 tab 开始，向左右扩展
   - 优先添加右侧 tabs（更符合用户习惯）

3. **CSS Grid 布局**
   - `grid-cols-[1fr_auto]` 确保右侧按钮不被压缩
   - 左侧区域使用 `flex-1` 和 `overflow-hidden`
   - 右侧区域使用 `shrink-0` 和 `min-width: max-content`

4. **ResizeObserver 集成**
   - 实时测量右侧按钮宽度
   - 动态调整 Tabs 容器最大宽度
   - 防抖处理避免频繁计算

### 代码质量验证

- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过
- ✅ 代码格式化完成
- ✅ 所有功能测试通过

### 功能验证

#### 路由同步
- ✅ 点击侧边栏菜单项自动创建/激活 Tab
- ✅ Tab 显示正确的标题和图标
- ✅ 点击 Tab 可以切换到对应路由

#### 标签页管理
- ✅ 标签页数量限制正常工作（最多 8 个可关闭的）
- ✅ 默认 Dashboard 标签页不占限额
- ✅ 超过限制时自动替换最早的标签页

#### 溢出处理
- ✅ 激活的 tab 始终可见
- ✅ 隐藏的 tabs 显示在下拉菜单中
- ✅ 容器宽度变化时自动重新计算

#### 右键菜单
- ✅ 关闭当前标签页功能正常
- ✅ 关闭其他标签页功能正常
- ✅ 关闭全部标签页功能正常
- ✅ 关闭最后一个标签页时自动跳转到默认路由

#### Header 布局
- ✅ 右侧按钮不被压缩
- ✅ Tabs 正确显示，无空白
- ✅ 响应式布局正常

### 技术细节

#### 状态管理
```typescript
// route-tabs-store.ts
- RouteTab 接口：id, title, url, icon, closable
- MAX_CLOSABLE_TABS = 8
- DEFAULT_TAB: /dashboard/overview（不可关闭）
- persist 中间件：skipHydration: true
```

#### 路由同步
```typescript
// use-route-tabs.ts
- 监听 pathname 变化
- 从 nav-config 查找菜单项
- 自动创建/激活 Tab
- switchToTab 函数切换路由
```

#### 溢出处理
```typescript
// route-tabs.tsx
- 分离测量容器（隐藏）
- 智能可见性计算算法
- ResizeObserver 监听容器尺寸
- 防抖处理（100ms）
```

#### Header 布局
```typescript
// header.tsx
- CSS Grid: grid-cols-[1fr_auto]
- ResizeObserver 测量右侧按钮宽度
- 动态调整 Tabs 容器最大宽度
```

## 后续建议

1. 考虑添加标签页拖拽排序功能
2. 考虑添加标签页固定功能
3. 考虑添加标签页快捷键支持（如 Ctrl+W 关闭当前）

## 相关文档

- 提案：`proposal.md`
- 任务清单：`tasks.md`
- 实现文件：
  - `src/stores/route-tabs-store.ts`
  - `src/hooks/use-route-tabs.ts`
  - `src/components/layout/route-tabs.tsx`
  - `src/components/layout/header.tsx`

---

**状态**：✅ 已完成并归档
