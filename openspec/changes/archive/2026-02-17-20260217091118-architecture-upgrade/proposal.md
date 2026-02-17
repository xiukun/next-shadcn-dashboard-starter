# Change Proposal: 架构升级 - 集成最新依赖库和 HTTP 客户端

## Change ID

`20260217091118-architecture-upgrade`

## 为什么（Why）

当前项目需要升级架构以支持：

1. **统一的 HTTP 客户端**：目前使用零散的 `fetch` 调用，缺乏统一的错误处理、请求拦截和响应处理
2. **React Query 集成**：需要强大的数据获取、缓存和状态管理能力
3. **依赖库更新**：集成最新版本的 `ky`、`@tanstack/react-query`、`json-render` 等
4. **包管理器迁移**：从 `bun` 迁移到 `pnpm` 以提升依赖管理效率
5. **Mock 数据增强**：更好地利用 `@faker-js/faker` 进行数据模拟

## 什么（What）

### 1. 依赖库更新和新增

- 更新 `react-hook-form` 到 `^7.54.2`
- 更新 `tailwind-merge` 到 `^3.0.1`
- 更新 `zod` 到 `^3.24.1`
- 更新 `zustand` 到 `^5.0.3`
- 新增 `ky` 作为 HTTP 客户端
- 新增 `@tanstack/react-query` 用于数据获取和缓存
- 新增 `json-render` 用于 JSON 数据渲染
- 确保 `lucide-react`、`clsx`、`tailwind-merge` 为最新版本

### 2. HTTP 客户端封装（ky + react-query）

- 创建基于 `ky` 的 HTTP 客户端封装
- 集成请求/响应拦截器
- 统一错误处理
- 与 `react-query` 深度集成
- 支持 TypeScript 类型推导

### 3. React Query 配置

- 设置 `QueryClient` 和 `QueryClientProvider`
- 配置默认的查询选项（staleTime、cacheTime 等）
- 集成到现有的 Providers 结构

### 4. Mock 数据系统增强

- 扩展现有的 `mock-api.ts` 以更好地利用 faker
- 创建 Mock Service Worker (MSW) 或类似的拦截方案（可选）
- 确保 mock 数据与新的 HTTP 客户端兼容

### 5. 包管理器迁移

- 从 `bun` 迁移到 `pnpm`
- 更新所有脚本命令
- 创建 `.npmrc` 配置
- 移除 `bun.lock`，生成 `pnpm-lock.yaml`

## 影响（Impact）

### 正面影响

- ✅ 统一的 HTTP 请求处理，提升代码可维护性
- ✅ React Query 提供强大的缓存和状态管理
- ✅ 更好的 TypeScript 类型支持
- ✅ 更高效的依赖管理（pnpm）
- ✅ 更好的开发体验和调试能力

### 潜在风险

- ⚠️ 需要重构现有的数据获取逻辑
- ⚠️ 可能影响现有组件的渲染行为
- ⚠️ 需要更新所有使用 `fetch` 的地方
- ⚠️ 包管理器迁移可能影响 CI/CD 流程

### 受影响的范围

- `src/lib/` - 新增 HTTP 客户端封装
- `src/components/layout/providers.tsx` - 添加 React Query Provider
- `src/constants/mock-api.ts` - 增强 mock 数据
- `src/features/**` - 更新数据获取逻辑
- `package.json` - 依赖更新和脚本修改
- 所有使用数据获取的组件

## 验收标准

1. ✅ 所有依赖库版本符合要求
2. ✅ ky HTTP 客户端封装完成，支持拦截器和错误处理
3. ✅ React Query Provider 正确集成到应用
4. ✅ 至少一个示例功能使用新的 HTTP 客户端和 react-query
5. ✅ Mock 数据系统正常工作
6. ✅ 包管理器成功迁移到 pnpm
7. ✅ 所有现有功能正常工作
8. ✅ TypeScript 类型检查通过
9. ✅ 构建和开发服务器正常运行
