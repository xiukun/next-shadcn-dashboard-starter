## 1. 分析与设计

- [ ] 1.1 枚举所有 `@clerk/nextjs` / `@clerk/nextjs/server` / `@clerk/themes` 的使用点，按「UI 组件」「路由保护」「用户/组织数据」分类。
- [ ] 1.2 梳理当前登录、登出与 token/会话获取流程（包括 `middleware`、`Providers`、`dashboard` 受保护页面），形成简单时序/数据流图。
- [ ] 1.3 设计 `auth client` 抽象接口（包括：登录、登出、获取当前用户、获取组织/权限、读取 token），并确定最小必要字段与错误模型。
- [ ] 1.4 设计 MSW + Faker 的 mock 接口形态（路径、请求/响应结构），确保可以覆盖现有 UI 所需的全部字段。

## 2. 基础设施：MSW + Faker 集成

- [ ] 2.1 安装并配置依赖（`msw`、`@faker-js/faker` 等），在 `package.json` 中为开发/测试添加初始化脚本（不影响生产构建）。
- [ ] 2.2 在 `src/mocks/` 下创建 MSW handler 与 worker/server 初始化文件（浏览器 + Node 支持），统一从单一点启动。
- [ ] 2.3 使用 Faker 实现用户、组织、会话等数据工厂（如 `createMockUser`、`createMockOrg`），并在 handler 中复用。
- [ ] 2.4 增加环境开关（如 `NEXT_PUBLIC_AUTH_MODE`），在 dev/test 下默认启用 MSW Mock，生产环境保持关闭。

## 3. 认证抽象与 Providers 重构

- [ ] 3.1 在 `src/lib/` 下新增 `auth-client` 抽象实现（接口 + mock 实现 + Clerk 实现占位），用 TypeScript 明确类型。
- [ ] 3.2 在 `src/components/layout/providers.tsx` 中引入新的 AuthProvider（或等价机制），将 “真实 Clerk 模式” 与 “MSW Mock 模式” 切换逻辑收敛到此处。
- [ ] 3.3 为后续组件（`user-nav`、`org-switcher` 等）提供新的 Hook（如 `useAuthUser`、`useAuthOrg`）作为唯一依赖入口。

## 4. 登录视图与路由保护重构

- [ ] 4.1 重构 `src/features/auth/components/sign-in-view.tsx`（以及 `sign-up-view.tsx` 如有）以使用 `auth client` 抽象而不是直接嵌入 `<ClerkSignInForm>`，在真实模式下仍可保留 Clerk UI 包装。
- [ ] 4.2 调整受保护路由的访问控制逻辑：
  - [ ] 4.2.1 对使用 `clerkMiddleware` / `auth.protect()` 的中间件进行封装或分支处理，在 Mock 模式下通过自定义校验（读取 cookie/header 中的 token）实现等价保护。
  - [ ] 4.2.2 确认 `dashboard`、`workspaces`、`profile` 等页面的 `auth` 调用路径全部迁移到新的抽象层。
- [ ] 4.3 更新用户信息与组织组件（`user-nav`、`org-switcher` 等）以使用新的 auth Hook，并在两种模式下行为一致。

## 5. 验证与测试

- [ ] 5.1 在 Mock 模式下手动验证完整登录流程：未登录访问受保护路由 → 重定向到登录 → 登录成功 → 可访问 `/dashboard/**`。
- [ ] 5.2 验证 token/会话过期或登出行为：登出后访问受保护路由应重新要求登录。
- [ ] 5.3 如项目已有测试框架，为 auth 抽象与 MSW handler 补充至少 1~2 个集成/端到端测试用例（可选）。
- [ ] 5.4 在真实 Clerk 模式下验证：现有生产登录流程、RBAC 导航与组织切换行为保持不变。

## 6. 文档与归档

- [ ] 6.1 在 `docs/` 下新增或更新认证相关文档，说明两种模式（Clerk / MSW Mock）的切换方式与适用场景。
- [ ] 6.2 在 `openspec/changes/refactor-auth-msw/proposal.md` 和本 `tasks.md` 中更新实际实施结果，标记已完成项。
- [ ] 6.3 运行 `openspec-cn validate refactor-auth-msw --strict`（如可用），修正规范/变更中的格式问题。
- [ ] 6.4 待变更上线并稳定后，将该 change 归档至 `openspec/changes/archive`，并根据需要更新 `specs/auth/spec.md` 等正式规范。

