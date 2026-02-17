# 架构升级说明

## 变更概述

本次架构升级完成了以下主要变更：

### 1. 依赖库更新

- ✅ `react-hook-form`: `^7.54.1` → `^7.54.2`
- ✅ `zod`: `^4.1.8` → `^4.1.8`
- ✅ `zustand`: `^5.0.2` → `^5.0.3`
- ✅ 新增 `ky`: `^1.7.2` - HTTP 客户端
- ✅ 新增 `@tanstack/react-query`: `^5.62.11` - 数据获取和缓存
- ✅ 新增 `@tanstack/react-query-devtools`: `^5.62.11` - 开发工具

### 2. 包管理器迁移

- ✅ 从 `bun` 迁移到 `pnpm`
- ✅ 创建 `.npmrc` 配置文件
- ✅ 更新所有脚本命令

### 3. HTTP 请求工具架构

创建了基于 `ky` 的统一 HTTP 请求工具，**同时支持服务端渲染（SSR）和客户端渲染**：

- `src/lib/api/request.ts` - HTTP 请求封装（支持 SSR 和客户端）
- `src/lib/api/hooks.ts` - React Query hooks 封装（仅客户端）
- `src/lib/api/types.ts` - TypeScript 类型定义
- `src/lib/api/errors.ts` - 统一错误处理
- `src/lib/api/mock-handlers.ts` - Mock 数据支持

### 4. React Query 集成

- `src/lib/react-query/config.ts` - QueryClient 配置
- `src/lib/react-query/provider.tsx` - React Query Provider
- 已集成到 `src/components/layout/providers.tsx`

### 5. API 路由

创建了 Next.js API 路由用于 mock 数据：

- `src/app/api/products/route.ts` - 产品列表 API
- `src/app/api/products/[id]/route.ts` - 单个产品 API

### 6. 功能示例

- `src/features/products/api/products.ts` - 产品 API hooks
- `src/features/products/components/product-listing-client.tsx` - 客户端组件示例

## 使用指南

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 使用新的 API 请求工具

参考 `docs/api-request.md` 获取详细使用文档。

### 示例：服务端渲染（推荐）

```typescript
import { fetchProducts } from '@/features/products/api/products';

export default async function ProductsPage() {
  const products = await fetchProducts({ page: 1, limit: 10 });

  return <ProductList data={products.data} total={products.total} />;
}
```

### 示例：客户端渲染（复杂交互场景）

```typescript
'use client';

import { useProducts } from '@/features/products/api/products';

function ProductsList() {
  const { data, isLoading, error } = useProducts({
    page: 1,
    limit: 10
  });

  // ...
}
```

## 下一步

1. 逐步迁移现有功能使用新的 API 客户端
2. 根据需要扩展 API hooks
3. 配置生产环境的 API URL
4. 考虑添加 MSW (Mock Service Worker) 用于更强大的 mock 支持

## 相关文档

- [API Client 使用文档](./docs/api-request.md)
- [OpenSpec Change 提案](./openspec/changes/20260217091118-architecture-upgrade/proposal.md)
