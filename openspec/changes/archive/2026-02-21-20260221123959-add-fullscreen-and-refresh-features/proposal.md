# 变更提案：添加全屏功能和标签页刷新功能

**变更 ID**: `20260221123959-add-fullscreen-and-refresh-features`  
**创建时间**: 2026-02-21  
**状态**: 已完成（已调整：全屏模式下保留 Header）

## 变更概述

在 Header 组件中添加全屏功能按钮和标签页刷新功能按钮，允许用户将内容区域切换为全屏模式，以及刷新当前激活的标签页。

## 为什么

### 问题背景

1. **全屏查看需求**：用户希望能够在查看内容时切换到全屏模式，隐藏侧边栏和 Header，获得更大的内容展示区域
2. **标签页刷新需求**：用户希望能够快速刷新当前激活的标签页，重新加载页面内容，而无需手动刷新整个浏览器页面
3. **图标缺失**：当前图标库中缺少全屏和刷新相关的图标

### 解决方案

1. 在 `icons.tsx` 中添加全屏和刷新图标
2. 在 Header 组件中添加全屏切换按钮
3. 实现内容区域全屏状态管理
4. 在标签页组件中添加刷新功能按钮
5. 实现标签页刷新逻辑

## 变更原因

1. **用户体验优化**：提供全屏模式，让用户专注于内容查看
2. **操作便利性**：提供标签页刷新功能，方便用户快速刷新当前页面
3. **功能完整性**：补充缺失的图标和功能，完善系统功能集

## 变更内容

### 1. 新增图标

- **文件**: `src/components/icons.tsx`
- **新增图标**:
  - `fullscreen`: 全屏图标（`IconMaximize`）
  - `fullscreenExit`: 退出全屏图标（`IconMinimize`）
  - `refresh`: 刷新图标（`IconRefresh`）

### 2. 新增全屏状态管理

- **文件**: `src/stores/fullscreen-store.ts`（新建）
- **功能**:
  - 使用 Zustand 管理全屏状态
  - 提供 `isFullscreen` 状态
  - 提供 `toggleFullscreen` 方法
  - 监听浏览器全屏 API 变化

### 3. 修改 Header 组件

- **文件**: `src/components/layout/header.tsx`
- **变更**:
  - 添加全屏切换按钮
  - 根据全屏状态显示不同的图标（全屏/退出全屏）
  - 点击按钮切换全屏状态

### 4. 修改 RouteTabs 组件

- **文件**: `src/components/layout/route-tabs.tsx`
- **变更**:
  - 在激活的标签页上添加刷新按钮
  - 实现刷新功能：重新加载当前标签页的路由
  - 刷新按钮仅在激活标签页上显示

### 5. 修改布局组件

- **文件**: `src/app/[locale]/dashboard/layout.tsx`（或相关布局文件）
- **变更**:
  - 根据全屏状态条件渲染侧边栏和 Header
  - 全屏模式下隐藏侧边栏和 Header
  - 保持内容区域的正常显示

## 技术实现

### 全屏功能

使用浏览器 Fullscreen API：

```typescript
// 进入全屏
document.documentElement.requestFullscreen()

// 退出全屏
document.exitFullscreen()

// 监听全屏状态变化
document.addEventListener('fullscreenchange', handler)
```

### 标签页刷新

使用 Next.js 的 `router.refresh()` 或 `window.location.reload()`：

```typescript
// 刷新当前路由
router.refresh()

// 或重新加载页面
window.location.reload()
```

### 状态管理

使用 Zustand 创建 `useFullscreenStore`：

```typescript
interface FullscreenStore {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}
```

## 影响范围

### 修改的文件

1. `src/components/icons.tsx` - 添加全屏和刷新图标
2. `src/components/layout/header.tsx` - 添加全屏切换按钮
3. `src/components/layout/route-tabs.tsx` - 添加刷新按钮和刷新逻辑
4. `src/app/[locale]/dashboard/layout.tsx` - 根据全屏状态条件渲染布局

### 新增的文件

1. `src/stores/fullscreen-store.ts` - 全屏状态管理

### 依赖关系

- 依赖现有的 `RouteTabs` 和 `Header` 组件
- 依赖 `@tabler/icons-react` 图标库
- 使用浏览器 Fullscreen API
- 使用 Next.js 路由 API

## 验收标准

1. ✅ `icons.tsx` 中新增 `fullscreen`、`fullscreenExit`、`refresh` 图标
2. ✅ Header 右侧显示全屏切换按钮
3. ✅ 点击全屏按钮后，内容区域进入全屏模式（隐藏侧边栏和 Header）
4. ✅ 全屏模式下，全屏按钮图标变为退出全屏图标
5. ✅ 点击退出全屏按钮后，恢复正常布局
6. ✅ 激活的标签页上显示刷新按钮
7. ✅ 点击刷新按钮后，当前标签页内容刷新
8. ✅ 非激活标签页不显示刷新按钮
9. ✅ 全屏状态正确同步到 Store
10. ✅ 浏览器原生全屏快捷键（F11）也能正确同步状态

## 风险与注意事项

1. **浏览器兼容性**：Fullscreen API 在不同浏览器中的实现可能有差异，需要添加兼容性处理
2. **状态同步**：确保浏览器原生全屏快捷键（F11）和按钮点击的状态同步
3. **布局切换**：全屏模式切换时确保布局平滑过渡，无闪烁
4. **路由刷新**：标签页刷新时确保不会丢失当前状态（如滚动位置、表单数据等）
5. **SSR 兼容性**：全屏状态管理需要考虑 SSR 兼容性，避免服务端渲染错误

## 后续扩展

未来可以添加的功能：
- 全屏模式下的快捷键支持
- 刷新按钮的加载状态指示
- 刷新历史记录
- 全屏模式下的自定义布局选项
