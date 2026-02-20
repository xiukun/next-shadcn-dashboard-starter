## 新增需求

### 需求：路由 Tabs Hook 激活状态与多语言标题同步

系统**必须**确保路由 Tabs Hook 的激活状态与当前路由 URL 一致，**必须**根据当前 locale 自动更新 Tab 标题，**必须**在多语言环境下使用 canonical path 作为 Tab ID。

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

#### 场景：Tab 激活状态同步

- **当** 路由发生变化时
- **那么** 系统检查当前路由对应的 Tab 是否存在
- **并且** 如果 Tab 存在，确保 `activeTabId` 与当前 canonical path 一致
- **并且** 如果 Tab 的标题、图标或 URL 有变化，则更新 Tab 内容
- **并且** 如果 Tab 内容完全一致，则不触发更新，避免无限循环

#### 场景：Tab 标题多语言更新

- **当** Tab 已存在且路由发生变化时
- **那么** 系统根据当前 locale 和导航配置更新 Tab 的标题
- **并且** 如果当前 locale 与 Tab 标题不匹配，则更新为对应语言的标题
- **并且** 默认 Tab 的初始标题为英文「Dashboard」，会在首次访问时根据当前 locale 更新
