# 布局偏好设置规范

**变更 ID**: `20260217152858-add-header-settings-panel`  
**规范类型**: 增量规范

## 概述

定义用户布局偏好设置的存储结构和行为规范。

## 数据结构

### UserPreferences 接口

```typescript
interface UserPreferences {
  /**
   * 是否启用标签栏
   * 默认值: true
   * 当为 true 时，显示 RouteTabs 组件
   * 当为 false 时，显示 Breadcrumbs 组件
   */
  enableTabs: boolean;

  /**
   * 是否显示面包屑
   * 默认值: true
   * 当 enableTabs 为 false 时，此设置生效
   * 当 enableTabs 为 true 时，此设置被忽略
   */
  showBreadcrumbs: boolean;

  /**
   * 面包屑样式
   * 默认值: 'regular'
   * 'regular': 常规样式（无背景）
   * 'background': 背景样式（有背景色）
   */
  breadcrumbStyle: 'regular' | 'background';
}
```

## 状态管理

### Store 定义

使用 Zustand 创建 `useUserPreferencesStore`，包含以下方法：

```typescript
interface UserPreferencesStore {
  // 状态
  enableTabs: boolean;
  showBreadcrumbs: boolean;
  breadcrumbStyle: 'regular' | 'background';

  // 方法
  setEnableTabs: (value: boolean) => void;
  setShowBreadcrumbs: (value: boolean) => void;
  setBreadcrumbStyle: (value: 'regular' | 'background') => void;
}
```

### 持久化

- 使用 Zustand `persist` 中间件
- 存储键名: `user-preferences-store`
- 存储位置: localStorage
- SSR 兼容性: 使用 `skipHydration: true`

## 行为规范

### 默认值

首次访问或 localStorage 为空时，使用以下默认值：

```typescript
{
  enableTabs: true,
  showBreadcrumbs: true,
  breadcrumbStyle: 'regular'
}
```

### 显示逻辑

#### Header 组件中的条件渲染

```typescript
const { enableTabs } = useUserPreferencesStore();

// 条件渲染
{enableTabs ? <RouteTabs /> : <Breadcrumbs />}
```

#### RouteTabs 组件

- 当 `enableTabs` 为 `true` 时，正常渲染
- 当 `enableTabs` 为 `false` 时，返回 `null`

#### Breadcrumbs 组件

- 当 `enableTabs` 为 `true` 时，返回 `null`
- 当 `enableTabs` 为 `false` 且 `showBreadcrumbs` 为 `true` 时，正常渲染
- 当 `enableTabs` 为 `false` 且 `showBreadcrumbs` 为 `false` 时，返回 `null`
- 根据 `breadcrumbStyle` 应用不同的样式类

### 状态更新

- 所有状态更新立即生效（实时预览）
- 状态自动持久化到 localStorage
- 状态更新不触发页面刷新

## UI 交互

### 设置面板中的控制

#### "启用标签栏"开关

- 类型: Switch 组件
- 标签: "启用标签栏"
- 绑定: `enableTabs`
- 行为: 切换时立即更新状态

#### "显示面包屑"开关

- 类型: Switch 组件
- 标签: "显示面包屑"
- 绑定: `showBreadcrumbs`
- 行为: 
  - 当 `enableTabs` 为 `true` 时，禁用此开关
  - 当 `enableTabs` 为 `false` 时，启用此开关
  - 切换时立即更新状态

#### "面包屑样式"选择

- 类型: RadioGroup 或 Select 组件
- 标签: "面包屑样式"
- 选项:
  - "常规" (`regular`)
  - "背景" (`background`)
- 绑定: `breadcrumbStyle`
- 行为: 选择时立即更新状态

## 约束条件

1. `enableTabs` 和 `showBreadcrumbs` 不能同时为 `false`（至少显示一种导航方式）
2. 当 `enableTabs` 为 `true` 时，`showBreadcrumbs` 设置被忽略
3. 状态更新必须是同步的，不能有延迟
4. 持久化必须使用 localStorage，不能使用 sessionStorage

## 扩展性

未来可以添加以下设置项：

- `maxTabs`: 最大标签数
- `persistentTabs`: 是否持久化标签页
- `breadcrumbShowIcon`: 是否显示面包屑图标
- `breadcrumbShowHome`: 是否显示首页按钮
