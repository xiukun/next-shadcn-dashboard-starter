# 变更提案：迁移所有路由到 locale 下

## Change ID

`20260221075833-migrate-all-routes-to-locale`

## 为什么

在实现多语言支持后，项目中存在两套并行的路由结构：

1. **旧路由结构**（无 locale 前缀）：
   - `src/app/dashboard/`
   - `src/app/auth/`
   - `src/app/about/`
   - `src/app/privacy-policy/`
   - `src/app/terms-of-service/`

2. **新路由结构**（有 locale 前缀）：
   - `src/app/[locale]/dashboard/`
   - `src/app/[locale]/auth/`
   - `src/app/[locale]/about/`
   - `src/app/[locale]/privacy-policy/`
   - `src/app/[locale]/terms-of-service/`

**问题**：
- 代码重复：两套路由结构维护成本高
- 路由混乱：旧路由会被中间件重定向，但代码仍然存在
- 维护困难：修改功能需要在两个地方同步更新
- 不符合规范：根据 i18n 规范，所有路由应该在 `[locale]` 下

## 变更内容

1. **删除旧路由目录**：
   - 删除 `src/app/dashboard/`（已迁移到 `[locale]/dashboard/`）
   - 删除 `src/app/auth/`（已迁移到 `[locale]/auth/`）
   - 删除 `src/app/about/`（已迁移到 `[locale]/about/`）
   - 删除 `src/app/privacy-policy/`（已迁移到 `[locale]/privacy-policy/`）
   - 删除 `src/app/terms-of-service/`（已迁移到 `[locale]/terms-of-service/`）

2. **验证路由逻辑**：
   - 确保中间件正确重定向旧路由到新路由
   - 确保所有导航链接使用 locale 前缀
   - 确保所有内部重定向使用 locale 前缀

3. **更新根页面重定向**：
   - 确保 `src/app/page.tsx` 正确重定向到 `/{locale}/dashboard/overview`

## 影响范围

- **删除目录**：
  - `src/app/dashboard/`
  - `src/app/auth/`
  - `src/app/about/`
  - `src/app/privacy-policy/`
  - `src/app/terms-of-service/`

- **验证文件**：
  - `src/app/page.tsx` - 根页面重定向
  - `src/proxy.ts` - 中间件重定向逻辑
  - `src/config/nav-config.ts` - 导航配置（已通过 hook 处理）

- **保留目录**：
  - `src/app/api/` - API 路由不需要 locale
  - `src/app/[locale]/` - 所有页面路由

## 技术方案

### 1. 删除旧路由目录

由于中间件配置了 `localePrefix: 'always'`，所有访问 `/dashboard/*` 的请求会自动重定向到 `/zh/dashboard/*`（默认语言）。因此可以安全删除旧目录。

### 2. 验证重定向逻辑

中间件 `src/proxy.ts` 中的 `intlMiddleware` 会：
- 检测到 `/dashboard` 路径
- 自动添加默认 locale 前缀
- 重定向到 `/zh/dashboard`

### 3. 导航链接处理

`useTranslatedNavItems` hook 已经处理了导航链接的 locale 前缀：
- 读取 `nav-config.ts` 中的路径（如 `/dashboard/overview`）
- 自动添加当前 locale 前缀（如 `/zh/dashboard/overview`）

## 验收标准

1. ✅ 所有旧路由目录已删除
2. ✅ 访问 `/dashboard/overview` 自动重定向到 `/zh/dashboard/overview`
3. ✅ 访问 `/auth/sign-in` 自动重定向到 `/zh/auth/sign-in`
4. ✅ 所有导航链接正确显示 locale 前缀
5. ✅ 内部重定向（如 `redirect()`）使用 locale 前缀
6. ✅ TypeScript 类型检查通过
7. ✅ 构建成功：`pnpm build` 无错误

## 风险与回滚

### 风险

1. **直接访问旧路由**：如果用户收藏了旧路由，会被重定向，但体验正常
2. **外部链接**：如果有外部链接指向旧路由，会被重定向，但功能正常

### 回滚策略

如果出现问题，可以：
1. 从 git 历史恢复旧目录
2. 中间件会自动处理重定向，不会导致 404

## 注意事项

1. **API 路由**：`src/app/api/` 不需要迁移，API 路由不需要 locale 前缀
2. **静态资源**：`favicon.ico` 等静态资源不需要迁移
3. **特殊页面**：`global-error.tsx`、`not-found.tsx` 等特殊页面保留在根目录
