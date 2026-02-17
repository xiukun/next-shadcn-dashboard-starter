# 变更提案：Header 设置面板

**变更 ID**: `20260217152858-add-header-settings-panel`  
**创建时间**: 2026-02-17  
**状态**: 已完成

## 变更概述

在 Header 组件中添加设置面板功能，允许用户配置面包屑和标签栏的显示行为，并将主题选择器从右侧按钮区域移动到设置面板中。

## 为什么

### 问题背景

1. **导航方式选择需求**：用户希望能够在标签栏和面包屑之间切换，但目前系统只支持标签栏
2. **Header 右侧按钮过多**：主题选择器和主题模式切换占用 Header 右侧空间，影响布局
3. **设置分散**：导航相关设置和主题设置分散在不同位置，缺乏统一入口

### 解决方案

通过添加统一的设置面板，将导航配置和主题设置集中管理，提升用户体验和界面整洁度。

## 变更原因

1. **用户体验优化**：提供统一的设置入口，让用户可以自定义导航显示方式
2. **界面简化**：将主题选择器从 Header 右侧移动到设置面板，减少 Header 右侧按钮数量
3. **功能整合**：将相关的导航配置（面包屑、标签栏）集中管理

## 变更内容

### 1. 新增设置面板组件

- **位置**: `src/components/layout/settings-panel.tsx`
- **功能**: 
  - 显示设置对话框/抽屉
  - 包含"布局"标签页，用于配置导航相关设置
  - 包含"外观"标签页，用于配置主题相关设置

### 2. 新增用户偏好设置 Store

- **位置**: `src/stores/user-preferences-store.ts`
- **功能**:
  - 使用 Zustand + persist 存储用户偏好
  - 管理以下设置：
    - `enableTabs`: 是否启用标签栏（默认 `true`）
    - `showBreadcrumbs`: 是否显示面包屑（当标签栏关闭时默认显示）
    - `breadcrumbStyle`: 面包屑样式（常规/背景）

### 3. 修改 Header 组件

- **文件**: `src/components/layout/header.tsx`
- **变更**:
  - 添加设置按钮（齿轮图标）
  - 根据 `enableTabs` 状态条件渲染 `RouteTabs` 或 `Breadcrumbs`
  - 移除右侧的 `ThemeSelector` 和 `ThemeModeToggle` 组件
  - 将主题选择器集成到设置面板中

### 4. 修改 RouteTabs 组件

- **文件**: `src/components/layout/route-tabs.tsx`
- **变更**:
  - 支持根据用户偏好显示/隐藏
  - 当 `enableTabs` 为 `false` 时不渲染

### 5. 修改 Breadcrumbs 组件

- **文件**: `src/components/breadcrumbs.tsx`
- **变更**:
  - 支持根据用户偏好显示/隐藏
  - 当 `enableTabs` 为 `true` 时不渲染
  - 支持不同的面包屑样式

## 技术实现

### 状态管理

使用 Zustand 创建 `useUserPreferencesStore`，包含：

```typescript
interface UserPreferences {
  enableTabs: boolean; // 默认 true
  showBreadcrumbs: boolean; // 当 enableTabs=false 时默认 true
  breadcrumbStyle: 'regular' | 'background'; // 默认 'regular'
  // 未来可扩展其他设置
}
```

### UI 组件

- 使用 shadcn/ui 的 `Dialog` 或 `Sheet` 组件作为设置面板容器
- 使用 `Tabs` 组件组织不同的设置分类
- 使用 `Switch` 组件实现开关设置
- 使用 `Select` 或 `RadioGroup` 实现单选设置

### 布局逻辑

```typescript
// Header 中的条件渲染
{enableTabs ? <RouteTabs /> : <Breadcrumbs />}
```

## 影响范围

### 修改的文件

1. `src/components/layout/header.tsx` - 添加设置按钮，条件渲染导航组件，移除主题按钮
2. `src/components/layout/route-tabs.tsx` - 移除内部条件检查（由 Header 控制），修复 Hooks 顺序问题，修复按钮嵌套问题
3. `src/components/breadcrumbs.tsx` - 支持显示/隐藏控制和样式切换

### 新增的文件

1. `src/components/layout/settings-panel.tsx` - 设置面板主组件
2. `src/stores/user-preferences-store.ts` - 用户偏好状态管理
3. `src/components/themes/theme-selector-inline.tsx` - 内联主题选择器组件（用于设置面板）

### 依赖关系

- 依赖现有的 `RouteTabs` 和 `Breadcrumbs` 组件
- 依赖现有的主题系统
- 使用 shadcn/ui 组件库

## 验收标准

1. ✅ Header 右侧显示设置按钮（齿轮图标）
2. ✅ 点击设置按钮打开设置面板
3. ✅ 设置面板包含"布局"和"外观"两个标签页
4. ✅ "布局"标签页包含：
   - 启用标签栏开关（默认开启）
   - 显示面包屑开关（标签栏关闭时默认开启）
   - 面包屑样式选择（常规/背景）
5. ✅ "外观"标签页包含：
   - 主题选择器（原 ThemeSelector）
   - 主题模式切换（原 ThemeModeToggle）
6. ✅ 当标签栏开启时，显示 RouteTabs，隐藏 Breadcrumbs
7. ✅ 当标签栏关闭时，显示 Breadcrumbs，隐藏 RouteTabs
8. ✅ 设置持久化保存到 localStorage
9. ✅ Header 右侧不再显示主题相关按钮
10. ✅ 设置面板支持实时预览

## 风险与注意事项

1. **状态同步**：确保 RouteTabs 和 Breadcrumbs 的状态切换平滑，无闪烁
2. **持久化**：使用 Zustand persist 确保设置持久化，注意 SSR 兼容性
3. **默认值**：确保首次访问时使用正确的默认值（标签栏默认开启）
4. **响应式**：设置面板在不同屏幕尺寸下正常显示
5. **可访问性**：确保设置面板支持键盘导航和屏幕阅读器

## 实际实现细节

### 实现调整

1. **RouteTabs 组件优化**：
   - 移除了组件内部的 `enableTabs` 检查，因为 Header 组件已经做了条件渲染
   - 修复了 React Hooks 顺序问题：移除了条件返回之前的 Hooks 调用
   - 修复了按钮嵌套问题：将关闭按钮从 `<button>` 改为 `<span>`，添加了可访问性支持

2. **主题选择器**：
   - 创建了 `ThemeSelectorInline` 组件，专用于设置面板
   - 使用按钮样式而非图标按钮，更适合设置面板的布局

3. **SSR 兼容性**：
   - 所有组件都使用 `skipHydration: true` 和 `mounted` 状态确保 SSR 兼容
   - 条件渲染逻辑在 Header 组件中统一管理

### 修复的问题

1. **React Hooks 顺序问题**：移除了 RouteTabs 组件中条件返回之前的 Hooks 调用
2. **HTML 嵌套错误**：修复了按钮嵌套问题，使用 `<span>` 替代内层 `<button>`
3. **状态管理优化**：简化了组件间的状态依赖关系

## 后续扩展

未来可以在设置面板中添加更多配置项：
- 标签栏相关设置（最大标签数、持久化标签页等）
- 面包屑相关设置（显示图标、显示首页按钮等）
- 其他 UI 偏好设置
