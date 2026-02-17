# 变更：使用 MSW + Faker 模拟网络级认证，替换 Clerk 登录并为后端接口预留适配层

## Change ID

`refactor-auth-msw`

## 为什么

当前项目强绑定 `@clerk/nextjs` 作为认证提供方，所有登录、会话与组织信息均直接依赖 Clerk 组件与 Hook，在本地开发和集成测试中存在几个问题，且 **面向中国企业管理平台场景时，Clerk 在合规、网络与本地化上并不适合直接上线**：

1. **环境依赖重**：需要配置 Clerk 应用与密钥，本地/CI 环境搭建成本较高，且 keyless 模式体验一般。
2. **端到端难以稳定复现**：无法在不访问 Clerk 云服务的情况下稳定模拟登录/登出、不同角色与组织场景。
3. **业务逻辑与供应商耦合**：前端登录与 token 处理直接调用 Clerk SDK，使得未来切换认证方案或增加本地/多租户模拟变得困难。

因此，在当前阶段我们不再以 Clerk 作为主认证方案，而是：

1. 使用 **MSW（Mock Service Worker）+ Faker.js** 实现“网络级模拟登录 + 会话管理”，满足日常开发与演示需求；
2. 将登录、token 与用户/组织读取统一抽象为独立的 `auth client`，未来可以无缝替换为 **企业自建/国产 IdP/后端接口**，而无需再回到 Clerk。

## 变更内容

- **新增** 基于 MSW 的认证 Mock 层（作为当前唯一实现）：
  - 在浏览器与 Node（如测试环境）中通过 MSW 拦截与“登录/登出/获取当前用户”等网络请求，返回由 Faker 生成的用户、组织与会话数据。
  - 提供简单的 REST/JSON 接口（如 `/auth/login`、`/auth/logout`、`/auth/me` 等），统一由 MSW 处理。
- **抽象** 认证与会话获取逻辑：
  - 在前端引入轻量的 `auth client` 抽象（例如 `src/lib/auth-client.ts`），屏蔽具体实现（当前是 MSW Mock，未来可接真实后端）。
  - 引入统一的登录结果与 token 结构（如 `{ accessToken, user, org }`），替代组件内部直接依赖 Clerk SDK 或特定后端字段。
- **重构** 登录视图与 Providers：
  - 移除对 `<ClerkProvider>`、`<ClerkSignInForm>` 等 Clerk 组件的直接依赖，改为自定义登录表单（可参考 Vben Admin 风格）调用 `auth client` 完成登录。
  - 在 `Providers` 中挂载自定义 `AuthProvider`，全局提供当前用户/组织上下文。
- **重构** 路由保护逻辑：
  - 替换 `clerkMiddleware` / `auth.protect()` 等逻辑，改为基于我们自己的 token 校验（例如从 Cookie 中读取会话 ID 或访问 token），保证 `/dashboard/**` 等受保护路由依然需要“已登录会话”。
- **预留未来真实接口接入点**：
  - `auth client` 提供清晰接口（登录、登出、获取当前用户/组织），未来只需替换其实现（由“MSW handler + Faker”替换为“真实后端 API 调用”），无需修改业务组件。

## 影响

- **受影响规范（候选能力域）**：
  - `auth`：登录、登出、令牌与会话获取逻辑。
  - `workspaces` / `profile`：依赖当前用户与组织上下文的页面（只要读取认证信息即受影响）。
- **受影响代码（初始预估）**：
  - `src/components/layout/providers.tsx`：移除 `ClerkProvider`，接入自定义 `AuthProvider`。
  - `src/proxy.ts`（包含 `clerkMiddleware`）：受保护路由的访问控制逻辑需要替换为自定义实现。
  - `src/features/auth/components/sign-in-view.tsx` / `sign-up-view.tsx`：登录/注册视图改为使用自定义表单 + `auth client`。
  - `src/components/layout/user-nav.tsx`、`src/components/org-switcher.tsx`：依赖 `useUser` / `useOrganization` 等 Clerk Hook 的组件需要迁移到新的 auth Hook。
  - `src/app/page.tsx`、`src/app/dashboard/page.tsx`、`src/app/dashboard/workspaces/**`、`src/app/dashboard/exclusive/page.tsx` 等中所有对 Clerk 的 server 侧依赖需要移除或替换。
- **重大变更标记**：
  - **重大变更**：认证与会话获取逻辑从“Clerk SDK + Clerk 中间件”重构为“自研 auth 抽象 + MSW Mock 后端”，Clerk 不再参与运行时行为。需要仔细验证登录流、token 校验与受保护路由访问，以及未来真实后端接入的兼容性。

