## 新增需求

### 需求：Dashboard Tabs 关闭行为

本需求在 `Dashboard Tabs 与多语言 canonical path` 的基础上，**必须（MUST）** 进一步规范 Tabs 关闭与自动创建行为。  
系统 MUST 在满足 canonical path 要求的前提下，**必须（MUST）** 保证：当用户显式关闭某个 Dashboard 路由的标签页时，在路由未发生变化之前不得自动重新创建该标签页。

#### 场景：监听路由变化（约束自动创建）

- **当** 路由发生变化时（通过 `usePathname()` 监听）
- **那么** 系统首先根据受支持的语言列表（如 `['zh', 'en']`）对 pathname 进行规范化处理：
  - 如果路径形如 `/{locale}/dashboard/...` 且 `{locale}` 属于受支持语言，则 canonical path 为去除 locale 前缀后的路径（如 `/en/dashboard/overview` → `/dashboard/overview`）
  - 否则，canonical path 等于原始 pathname
- **并且** 系统使用 canonical path 而不是原始 pathname 来：
  - 检查当前路由是否属于 Dashboard 路由（例如 `canonicalPath.startsWith('/dashboard')`）
  - 检查当前路由是否已经存在于 Tabs 列表中
  - 作为 Tabs 与缓存的唯一标识（ID）
- **并且** 只有在 **路由相关信息发生变化** 时才会自动创建或更新 Tab：
  - pathname / canonical path 变化
  - 查询参数（search params）变化
  - 导航配置（如翻译后的菜单项）变化
- **并且** 不得仅因为 Tabs Store 本身的数据变化（例如关闭某个 Tab 导致 `tabs` 数组变化）而重新自动创建当前路由对应的 Tab
- **并且** 对于默认 Dashboard 页面，canonical path 必须为 `/dashboard/overview`，并且在 Tabs 中始终只存在一个不可关闭的默认标签页，无论当前 locale 为何（如 `/zh/dashboard/overview` 或 `/en/dashboard/overview`）

#### 场景：关闭当前路由标签页

- **当** 用户当前位于某个 Dashboard 路由（例如 `/zh/dashboard/billing`），其 canonical path 为 `/dashboard/billing`
- **并且** Tabs 列表中存在 canonical path 为 `/dashboard/billing` 的可关闭标签页
- **当** 用户在该标签页上执行“关闭”操作（点击关闭按钮或通过右键菜单选择“关闭”）
- **那么** 系统 MUST：
  - 从 Tabs Store 中移除对应 canonical path 的标签页
  - 根据既有规则选择新的激活标签页（例如右侧优先，其次左侧，若无则回退到默认 Tab）
  - 触发路由跳转到新的激活标签页对应的 URL
- **并且** 在当前路由尚未变更为新的激活标签页前，系统 MUST NOT 因 Tabs Store 变化而重新自动创建刚刚关闭的 canonical path 对应的标签页
- **并且** 只有当用户之后再次导航回该 canonical path（例如再次点击侧边栏菜单或通过地址栏访问）时，系统才会根据“监听路由变化（约束自动创建）”场景重新创建对应的 Tab

