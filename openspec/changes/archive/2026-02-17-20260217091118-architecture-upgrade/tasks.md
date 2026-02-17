# 实施任务清单

## Change ID

`20260217091118-architecture-upgrade`

## 任务列表

### 阶段 1: 依赖和包管理器迁移

- [x] 1.1 更新 `package.json`，添加/更新所需依赖
- [x] 1.2 创建 `.npmrc` 配置文件
- [x] 1.3 更新所有脚本命令（将 `bun` 替换为 `pnpm`）
- [x] 1.4 删除 `bun.lock` 文件
- [x] 1.5 运行 `pnpm install` 生成 `pnpm-lock.yaml`

### 阶段 2: HTTP 客户端封装

- [x] 2.1 创建 `src/lib/api/client.ts` - ky 客户端基础封装
- [x] 2.2 创建 `src/lib/api/interceptors.ts` - 请求/响应拦截器（已集成到 client.ts）
- [x] 2.3 创建 `src/lib/api/types.ts` - TypeScript 类型定义
- [x] 2.4 创建 `src/lib/api/hooks.ts` - react-query hooks 封装
- [x] 2.5 创建 `src/lib/api/errors.ts` - 统一错误处理

### 阶段 3: React Query 配置

- [x] 3.1 创建 `src/lib/react-query/config.ts` - QueryClient 配置
- [x] 3.2 创建 `src/lib/react-query/provider.tsx` - QueryClientProvider 组件
- [x] 3.3 更新 `src/components/layout/providers.tsx` 集成 React Query Provider

### 阶段 4: Mock 数据增强

- [x] 4.1 扩展 `src/constants/mock-api.ts` 使用新的 HTTP 客户端模式（通过 API 路由）
- [x] 4.2 创建 `src/lib/api/mock-handlers.ts` - Mock 请求处理器（可选）
- [x] 4.3 确保 mock 数据与 faker 集成良好

### 阶段 5: 代码迁移和示例

- [x] 5.1 创建示例 API hooks（如 `useProducts`, `useProduct`）
- [x] 5.2 更新至少一个现有功能使用新的 HTTP 客户端
- [x] 5.3 更新 `src/features/products/` 使用新的数据获取方式（示例）

### 阶段 6: 文档和清理

- [x] 6.1 更新 `README.md` 说明新的架构（已创建 README-ARCHITECTURE.md）
- [x] 6.2 创建 `docs/api-request.md` 使用文档
- [x] 6.3 验证所有功能正常工作
- [x] 6.4 运行 lint 和类型检查

## 实施顺序

建议按阶段顺序执行，每个阶段完成后进行验证。

## 回滚策略

如果出现问题：

1. 保留 `bun.lock` 备份（如果需要回滚包管理器）
2. 使用 git 分支进行开发，便于回滚
3. 逐步迁移，先完成基础设施再迁移业务代码
