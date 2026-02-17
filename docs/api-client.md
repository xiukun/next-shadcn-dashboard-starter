# API Client 使用文档

## 概述

本项目使用基于 `ky` 和 `@tanstack/react-query` 的统一 HTTP 客户端架构。

## 核心组件

### 1. HTTP Client (`src/lib/api/client.ts`)

基于 `ky` 的 HTTP 客户端，提供统一的请求处理。

```typescript
import { apiClient, get, post, put, del } from '@/lib/api';

// 直接使用客户端
const response = await apiClient.get('/products').json();

// 使用便捷方法
const data = await get<Product[]>('/products');
const result = await post<Product, CreateProductDto>('/products', productData);
```

### 2. React Query Hooks (`src/lib/api/hooks.ts`)

封装了 `useQuery` 和 `useMutation` 的 hooks。

```typescript
import { useApiQueryData, useApiMutation } from '@/lib/api';

// 查询数据
function ProductsList() {
  const { data, isLoading, error } = useApiQueryData<Product[]>(
    ['products'],
    '/products'
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* 渲染产品列表 */}</div>;
}

// 创建数据
function CreateProduct() {
  const mutation = useApiMutation<Product, CreateProductDto>(
    '/products',
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

### 3. 功能特定的 Hooks

在 `src/features/*/api/` 目录下创建功能特定的 hooks。

```typescript
// src/features/products/api/products.ts
import { useApiQueryData, useApiMutation } from '@/lib/api';

export function useProducts(params?: ProductsQueryParams) {
  return useApiQueryData<PaginatedResponse<Product>>(
    ['products', params],
    `/products?${new URLSearchParams(params).toString()}`
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

1. **使用功能特定的 hooks**：在 `src/features/*/api/` 中创建 hooks
2. **类型安全**：始终使用 TypeScript 类型
3. **错误处理**：使用统一的错误处理工具
4. **缓存管理**：合理设置 `staleTime` 和 `gcTime`
5. **查询键**：使用有意义的查询键，便于缓存管理
