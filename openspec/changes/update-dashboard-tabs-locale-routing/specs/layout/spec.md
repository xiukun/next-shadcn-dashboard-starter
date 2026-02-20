## 新增需求

### 需求：Dashboard Tabs 与多语言 canonical path

系统 MUST 提供一致的 Dashboard Tabs 行为，必须在启用多语言路由（`/[locale]/...`）时，以去除 locale 前缀后的规范化路径（canonical path）作为 Tabs 与缓存的唯一标识。  
在任何 locale 下访问 Dashboard 路由时，系统必须保证默认 Dashboard 页面只对应一个不可关闭的 Tab。

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

#### 场景：监听路由变化（支持多语言 canonical path）

- **当** 路由发生变化时（通过 `usePathname()` 监听）
- **那么** 系统首先根据受支持的语言列表（如 `['zh', 'en']`）对 pathname 进行规范化处理：
  - 如果路径形如 `/{locale}/dashboard/...` 且 `{locale}` 属于受支持语言，则 canonical path 为去除 locale 前缀后的路径（如 `/en/dashboard/overview` → `/dashboard/overview`）
  - 否则，canonical path 等于原始 pathname
- **并且** 系统使用 canonical path 而不是原始 pathname 来：
  - 检查当前路由是否属于 Dashboard 路由（例如 `canonicalPath.startsWith('/dashboard')`）
  - 检查当前路由是否已经存在于 Tabs 列表中
  - 作为 Tabs 与缓存的唯一标识（ID）
- **并且** 如果 canonical path 在标签页列表中存在但尚未缓存，则缓存当前页面
- **并且** 如果 canonical path 在标签页列表中存在且已缓存，则显示对应的缓存页面
- **并且** 对于默认 Dashboard 页面，canonical path 必须为 `/dashboard/overview`，并且在 Tabs 中始终只存在一个不可关闭的默认标签页，无论当前 locale 为何（如 `/zh/dashboard/overview` 或 `/en/dashboard/overview`）

#### 场景：清理标签页缓存

- **当** 用户关闭某个标签页时
- **那么** 检查该标签页对应的 canonical path 是否已缓存
- **并且** 如果已缓存，则清理对应的缓存
- **并且** 释放相关内存

