## 修改需求

### 需求：URL 路由集成

> 本段落完整覆盖 `openspec/changes/20260220153548-add-internationalization/specs/i18n/spec.md` 中"需求：URL 路由集成"的内容，并补充所有路由必须在 `[locale]` 下的要求。

系统**必须**将语言集成到 URL 路由中，**必须**使用 `[locale]` 动态路由段，**必须**确保所有页面路由都在 `[locale]` 下，**必须**通过中间件自动重定向无 locale 前缀的旧路由。

#### 场景：语言路由

- **当** 用户访问应用时
- **那么** URL 包含语言前缀（如 `/zh/dashboard` 或 `/en/dashboard`）
- **并且** 所有页面路由都在 `[locale]` 下
- **并且** 无效的 locale 返回 404
- **并且** 访问无 locale 前缀的旧路由（如 `/dashboard`）时，中间件自动重定向到带 locale 的对应路由（如 `/zh/dashboard`）

#### 场景：路由结构要求

- **当** 创建新的页面路由时
- **那么** 路由必须在 `src/app/[locale]/` 目录下
- **并且** 不允许在 `src/app/` 根目录下创建页面路由（API 路由和特殊页面除外）
- **并且** API 路由（`src/app/api/`）不需要 locale 前缀
- **并且** 特殊页面（`global-error.tsx`、`not-found.tsx`）保留在根目录

#### 场景：默认语言路由

- **当** 配置 `localePrefix: 'always'` 时
- **那么** 所有语言（包括默认语言）都必须显示在 URL 中（如 `/zh/dashboard`、`/en/dashboard`）
- **并且** 访问无 locale 前缀的路由时，自动重定向到默认语言的对应路由
