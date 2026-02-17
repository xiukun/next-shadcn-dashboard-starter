# API 请求工具使用文档

## 概述

本项目使用基于 `ky` 和 `@tanstack/react-query` 的统一 HTTP 请求工具架构，**同时支持服务端渲染（SSR）和客户端渲染**。

## 核心组件

### 1. HTTP 请求工具 (`src/lib/api/request.ts`)

基于 `ky` 的 HTTP 请求封装，提供统一的请求处理，支持服务端和客户端使用。

#### 服务端使用（推荐）

```typescript
import { get, post, put, del } from '@/lib/api/request';

// 服务端组件中直接使用
export default async function ProductPage() {
  // 传入headers（如认证token）
  const products = await get<Product[]>('/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  });

  return <ProductList data={products.data} />;
}
```

#### 客户端使用

```typescript
import { apiRequest, get, post, put, del } from '@/lib/api/request';

// 直接使用请求客户端（自动从localStorage获取token）
const response = await apiRequest.get('/api/products').json();

// 使用便捷方法（自动从localStorage获取token）
const data = await get<Product[]>('/api/products');
const result = await post<Product, CreateProductDto>(
  '/api/products',
  productData
);
```

### 2. React Query Hooks (`src/lib/api/hooks.ts`)

封装了 `useQuery` 和 `useMutation` 的 hooks，**仅用于客户端组件**。

```typescript
'use client';

import { useApiQueryData, useApiMutation } from '@/lib/api';

// 查询数据（客户端组件）
function ProductsList() {
  const { data, isLoading, error } = useApiQueryData<Product[]>(
    ['products'],
    '/api/products'
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* 渲染产品列表 */}</div>;
}

// 创建数据（客户端组件）
function CreateProduct() {
  const mutation = useApiMutation<Product, CreateProductDto>(
    '/api/products',
    'POST'
  );

  const handleSubmit = async (data: CreateProductDto) => {
    try {
      const result = await mutation.mutateAsync(data);
      console.log('Created:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <form onSubmit={handleSubmit}>{/* 表单 */}</form>;
}
```

**注意**：这些 hooks 只能在客户端组件中使用（需要 `'use client'` 指令）。服务端组件应直接使用 `get/post/put/delete` 函数。

### 3. 功能特定的 API 函数和 Hooks

在 `src/features/*/api/` 目录下创建功能特定的 API 函数（服务端）和 hooks（客户端）。

```typescript
// src/features/products/api/products.ts

// 服务端函数（在服务端组件中使用）
import { get } from '@/lib/api/request';

export async function fetchProducts(params?: ProductsQueryParams) {
  return get<PaginatedResponse<Product>>(
    `/api/products?${new URLSearchParams(params).toString()}`
  );
}

// 客户端 hooks（在客户端组件中使用）
import { useApiQueryData } from '@/lib/api';

export function useProducts(params?: ProductsQueryParams) {
  return useApiQueryData<PaginatedResponse<Product>>(
    ['products', params],
    `/api/products?${new URLSearchParams(params).toString()}`
  );
}
```

## 错误处理

所有 API 错误都会自动转换为 `ApiError` 类型：

```typescript
import { isApiError, getErrorMessage } from '@/lib/api';

try {
  await post('/products', data);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.status, error.message);
  } else {
    console.error('Unknown error:', getErrorMessage(error));
  }
}
```

## Mock 数据

在开发环境中，可以使用 mock 数据：

1. 设置环境变量：`NEXT_PUBLIC_USE_MOCK=true`
2. 在 `src/app/api/` 下创建 API 路由
3. 使用 `src/constants/mock-api.ts` 中的 mock 数据

## 配置

### 环境变量

- `NEXT_PUBLIC_API_URL`: API 基础 URL（默认: `/api`）

### React Query 配置

在 `src/lib/react-query/config.ts` 中配置默认选项：

- `staleTime`: 数据新鲜度时间（默认: 5 分钟）
- `gcTime`: 缓存保留时间（默认: 10 分钟）
- `retry`: 失败重试次数（默认: 1 次）

## 最佳实践

1. **优先使用服务端渲染**：在服务端组件中直接使用 `get/post/put/delete` 函数
2. **客户端用于复杂交互**：仅在需要客户端交互（如表单、实时更新）时使用 React Query hooks
3. **使用功能特定的 API 函数**：在 `src/features/*/api/` 中创建服务端函数和客户端 hooks
4. **类型安全**：始终使用 TypeScript 类型
5. **错误处理**：使用统一的错误处理工具
6. **缓存管理**：合理设置 `staleTime` 和 `gcTime`（仅客户端 hooks）
7. **查询键**：使用有意义的查询键，便于缓存管理（仅客户端 hooks）

## 服务端 vs 客户端选择

### 使用服务端渲染（推荐）

- ✅ 初始页面加载
- ✅ SEO 重要页面
- ✅ 静态或半静态内容
- ✅ 服务端数据获取

```typescript
// 服务端组件
export default async function Page() {
  const products = await fetchProducts({ page: 1 });
  return <ProductList data={products.data} />;
}
```

### 使用客户端渲染

- ✅ 需要实时交互的页面
- ✅ 表单提交和验证
- ✅ 需要客户端状态管理
- ✅ 需要乐观更新

```typescript
// 客户端组件
'use client';

export default function InteractivePage() {
  const { data, mutate } = useProducts();
  // ... 交互逻辑
}
```
