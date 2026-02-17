# layout 规范

## 目的

定义应用布局（Layout）相关的规范，包括但不限于：Header、Sidebar、Tabs 导航与页面缓存（Keep-Alive）等能力。
## 需求

> 说明：本规范文件为布局能力的基线规范。具体能力的新增/修改由各变更（`openspec/changes/<change-id>/specs/layout/spec.md`）以增量形式提出，并在归档时合并到此处。

### 需求：Keep-Alive Provider 组件

系统**必须**提供全局的 Keep-Alive 缓存管理组件，**必须**管理所有路由的 DOM 缓存，**必须**根据用户设置决定是否启用缓存。

#### 场景：启用 Keep-Alive 时缓存页面

- **当** `enableKeepAlive` 为 `true` 时
- **并且** 用户切换到新的标签页
- **那么** 当前页面的 DOM 被缓存到内存中
- **并且** 新页面的 DOM 被渲染
- **并且** 缓存的页面使用 React Portal 和 DOM 操作管理

#### 场景：禁用 Keep-Alive 时直接渲染

- **当** `enableKeepAlive` 为 `false` 时
- **那么** 直接渲染 `children`，不进行任何缓存
- **并且** 行为与当前实现完全一致

#### 场景：监听路由变化

- **当** 路由发生变化时（通过 `usePathname()` 监听）
- **那么** 检查当前路由是否在标签页列表中
- **并且** 如果在列表中且未缓存，则缓存当前页面
- **并且** 如果在列表中且已缓存，则显示缓存的页面

#### 场景：清理标签页缓存

- **当** 用户关闭某个标签页时
- **那么** 检查该标签页对应的路由是否已缓存
- **并且** 如果已缓存，则清理对应的缓存
- **并且** 释放相关内存

### 需求：Keep-Alive Route 组件

系统**必须**提供单个路由的缓存管理组件，**必须**使用 React Portal 和 DOM 操作实现 DOM 节点的显示/隐藏。

#### 场景：激活路由时显示缓存

- **当** `activeKey === pageKey` 时
- **那么** 将缓存的 DOM 节点添加到 `parentDomRef.current`
- **并且** 使用 `createPortal` 将缓存的 React 节点渲染到 DOM 容器
- **并且** 页面正常显示和交互

#### 场景：非激活路由时隐藏缓存

- **当** `activeKey !== pageKey` 时
- **那么** 将缓存的 DOM 节点从 `parentDomRef.current` 移除
- **并且** DOM 节点保留在内存中，但不显示
- **并且** 页面状态（滚动位置、表单输入等）被保留

#### 场景：创建 DOM 容器

- **当** KeepAliveRoute 组件首次渲染时
- **那么** 使用 `useMemo` 创建唯一的 DOM 容器元素
- **并且** DOM 容器具有唯一的 ID（格式：`alive-${pageKey}`）
- **并且** DOM 容器具有 `data-keep-alive="true"` 属性

### 需求：用户偏好设置扩展

系统**必须**在用户偏好设置中添加 Keep-Alive 开关配置，**必须**支持持久化存储，**必须**默认启用。

#### 场景：初始化 Keep-Alive 设置

- **当** 用户首次访问应用时
- **那么** `enableKeepAlive` 使用默认值 `true`
- **并且** 设置自动保存到 localStorage
- **并且** 使用 `skipHydration: true` 避免 SSR 不匹配

#### 场景：更新 Keep-Alive 设置

- **当** 用户在设置面板中切换"启用页面缓存"开关时
- **那么** 立即更新 `enableKeepAlive` 状态
- **并且** KeepAliveProvider 立即响应变化
- **并且** 设置自动保存到 localStorage

#### 场景：持久化 Keep-Alive 设置

- **当** 用户修改 `enableKeepAlive` 设置时
- **那么** 立即保存到 localStorage
- **并且** 下次访问时自动恢复设置
- **并且** 刷新页面后设置保持不变

### 需求：设置面板 UI 扩展

系统**必须**在设置面板中添加 Keep-Alive 开关，**必须**提供清晰的说明文字，**必须**实时生效。

#### 场景：显示 Keep-Alive 开关

- **当** 用户打开设置面板并切换到"布局"标签页时
- **那么** 在"标签栏"部分显示"启用页面缓存"开关
- **并且** 开关位置在"启用标签栏"开关下方
- **并且** 显示说明文字："启用后，切换标签页时保留页面状态和 DOM 结构"

#### 场景：切换 Keep-Alive 开关

- **当** 用户点击"启用页面缓存"开关时
- **那么** 开关状态立即切换
- **并且** Keep-Alive 功能立即启用/禁用
- **并且** 设置自动保存
- **并且** 无需刷新页面即可生效

### 需求：Dashboard Layout 集成 Keep-Alive

系统**必须**修改 Dashboard Layout，**必须**使用 KeepAliveProvider 包裹页面内容，**必须**确保 SSR 兼容。

#### 场景：集成 Keep-Alive Provider

- **当** Dashboard Layout 渲染时
- **那么** 使用 `KeepAliveProvider` 包裹 `children`
- **并且** KeepAliveProvider 必须是 Client Component
- **并且** 确保 SSR 时不会出错

