# 实施任务清单

**变更 ID**: `20260217152858-add-header-settings-panel`  
**状态**: 已完成

## 任务列表

### 阶段 1: 状态管理基础

- [x] 1.1 创建用户偏好设置 Store
  - 文件: `src/stores/user-preferences-store.ts`
  - 使用 Zustand + persist
  - 定义接口：`enableTabs`, `showBreadcrumbs`, `breadcrumbStyle`
  - 默认值：`enableTabs: true`, `showBreadcrumbs: true`, `breadcrumbStyle: 'regular'`
  - 实现更新方法：`setEnableTabs`, `setShowBreadcrumbs`, `setBreadcrumbStyle`

### 阶段 2: 设置面板 UI

- [x] 2.1 创建设置面板主组件
  - 文件: `src/components/layout/settings-panel.tsx`
  - 使用 shadcn/ui `Dialog` 或 `Sheet` 组件
  - 实现标签页切换（布局/外观）
  - 添加标题和关闭按钮

- [x] 2.2 实现"布局"标签页内容
  - 文件: `src/components/layout/settings-panel.tsx`
  - 添加"启用标签栏"开关（Switch）
  - 添加"显示面包屑"开关（Switch，当标签栏关闭时默认开启）
  - 添加"面包屑样式"选择（RadioGroup 或 Select）
  - 连接状态管理 Store

- [x] 2.3 实现"外观"标签页内容
  - 文件: `src/components/layout/settings-panel.tsx`
  - 集成 `ThemeSelector` 组件
  - 集成 `ThemeModeToggle` 组件
  - 调整布局和样式

### 阶段 3: Header 组件修改

- [x] 3.1 添加设置按钮
  - 文件: `src/components/layout/header.tsx`
  - 在右侧按钮区域添加设置按钮（齿轮图标）
  - 点击打开设置面板
  - 使用合适的图标（Icons.settings 或 IconSettings）

- [x] 3.2 实现条件渲染逻辑
  - 文件: `src/components/layout/header.tsx`
  - 从 `useUserPreferencesStore` 读取 `enableTabs`
  - 条件渲染：`enableTabs ? <RouteTabs /> : <Breadcrumbs />`
  - 确保切换平滑

- [x] 3.3 移除主题相关按钮
  - 文件: `src/components/layout/header.tsx`
  - 移除 `<ThemeModeToggle />` 组件
  - 移除 `<ThemeSelector />` 组件
  - 调整右侧按钮区域布局

### 阶段 4: 组件适配

- [x] 4.1 修改 RouteTabs 组件
  - 文件: `src/components/layout/route-tabs.tsx`
  - 添加对 `enableTabs` 的响应
  - 当 `enableTabs` 为 `false` 时返回 `null`
  - 确保状态切换时无副作用

- [x] 4.2 修改 Breadcrumbs 组件
  - 文件: `src/components/breadcrumbs.tsx`
  - 添加对 `enableTabs` 和 `showBreadcrumbs` 的响应
  - 当 `enableTabs` 为 `true` 时返回 `null`
  - 当 `showBreadcrumbs` 为 `false` 时返回 `null`
  - 支持 `breadcrumbStyle` 样式切换

### 阶段 5: 样式和交互优化

- [x] 5.1 设置面板样式优化
  - 确保设置面板在不同屏幕尺寸下正常显示
  - 优化标签页切换动画
  - 优化开关和选择器的视觉反馈

- [x] 5.2 实时预览功能
  - 设置更改时立即生效
  - 无需点击保存按钮（自动保存）
  - 确保状态同步无延迟

- [x] 5.3 可访问性优化
  - 添加适当的 ARIA 标签
  - 支持键盘导航
  - 确保屏幕阅读器友好

### 阶段 6: 测试和验证

- [x] 6.1 功能测试
  - 测试设置面板打开/关闭
  - 测试标签栏开关功能
  - 测试面包屑显示/隐藏
  - 测试主题选择功能
  - 测试设置持久化

- [x] 6.2 边界情况测试
  - 测试首次访问时的默认值
  - 测试 localStorage 被清除后的行为
  - 测试快速切换设置时的状态一致性

- [x] 6.3 响应式测试
  - 测试不同屏幕尺寸下的显示效果
  - 测试移动端设置面板的显示

### 阶段 7: 文档和清理

- [x] 7.1 代码注释
  - 为新增组件添加 JSDoc 注释
  - 为 Store 方法添加注释说明

- [x] 7.2 更新相关文档（如需要）
  - 更新组件使用说明
  - 更新开发指南

## 实施顺序

1. **阶段 1** → 创建状态管理基础
2. **阶段 2** → 创建设置面板 UI
3. **阶段 3** → 修改 Header 组件
4. **阶段 4** → 适配现有组件
5. **阶段 5** → 样式和交互优化
6. **阶段 6** → 测试和验证
7. **阶段 7** → 文档和清理

## 注意事项

- 使用 TDD 方法：先写测试，再实现功能（如果项目有测试框架）
- 确保 SSR 兼容性：使用 `skipHydration` 或 `useEffect` 处理客户端状态
- 保持代码风格一致：遵循项目现有的代码风格和约定
- 使用 TypeScript 严格模式：确保类型安全
