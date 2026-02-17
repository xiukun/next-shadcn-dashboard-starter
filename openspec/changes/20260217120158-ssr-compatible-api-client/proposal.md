# 变更提案：SSR兼容的统一API客户端重构

## Change ID

`20260217120158-ssr-compatible-api-client`

## 问题描述

当前API客户端实现存在以下问题：

1. **服务端渲染不兼容**：`client.ts`中使用`typeof window !== 'undefined'`判断客户端，在服务端无法正确获取认证token
2. **架构分离**：客户端hooks（`hooks.ts`）和服务端直接调用分离，代码重复
3. **不符合框架最佳实践**：Next.js 16推荐服务端渲染优先，但当前实现偏向客户端渲染

## 目标

重构API客户端架构，实现：

1. **统一API客户端**：单个文件同时支持服务端和客户端使用
2. **SSR优先**：服务端组件可直接使用API客户端进行数据获取
3. **客户端兼容**：复杂页面仍可使用React Query hooks进行客户端渲染
4. **类型安全**：保持完整的TypeScript类型支持

## 影响范围

### 修改文件

- `src/lib/api/client.ts` → `request.ts` - 重构为SSR兼容的统一请求工具，重命名函数
- `src/lib/api/hooks.ts` - 更新hooks以使用新的请求工具
- `src/features/products/api/products.ts` - 更新为同时支持服务端和客户端
- `src/lib/api/index.ts` - 更新导出
- `docs/api-request.md` - 更新文档说明
- `README-ARCHITECTURE.md` - 更新架构说明

### 新增文件

- 无

### 删除文件

- `src/lib/api/client.ts` - 已重命名为`request.ts`

## 技术方案

### 1. 统一API请求工具（`request.ts`）

**实现要点：**
- 文件已从 `client.ts` 重命名为 `request.ts`
- 函数名从 `createApiClient` 改为 `createApiRequest`
- 实例名从 `apiClient` 改为 `apiRequest`
- 支持服务端和客户端的统一请求工具

```typescript
// 支持服务端和客户端的统一请求工具
export function createApiRequest(options?: {
  baseUrl?: string;
  headers?: Record<string, string>;
  // 服务端可传入headers，客户端自动从localStorage获取
});

// 服务端使用
const client = createApiRequest({
  headers: { Authorization: `Bearer ${token}` }
});

// 客户端使用（自动从localStorage获取token）
const client = createApiRequest();
export const apiRequest = createApiRequest(); // 默认实例
```

**Token处理逻辑：**
- 服务端：优先使用传入的 `headers.Authorization`
- 客户端：如果未传入 headers，自动从 `localStorage.getItem('auth_token')` 获取
- 仅在浏览器环境（`typeof window !== 'undefined'`）中访问 localStorage

### 2. 便捷函数（`get/post/put/patch/del`）

**实现要点：**
- 提供类型安全的便捷函数，支持服务端和客户端
- 服务端可通过 `options.headers` 传入认证token
- 客户端自动使用默认的 `apiRequest` 实例（自动获取token）

```typescript
// 服务端使用
const data = await get<Product[]>('/api/products', {
  headers: { Authorization: `Bearer ${token}` }
});

// 客户端使用（自动从localStorage获取token）
const data = await get<Product[]>('/api/products');
```

### 3. 服务端数据获取函数

```typescript
// 服务端组件可直接调用
export async function fetchProducts(
  params?: ProductsQueryParams,
  options?: { headers?: Record<string, string> }
): Promise<PaginatedResponse<Product>> {
  const response = await get<PaginatedResponse<Product>>(
    '/api/products',
    options
  );
  return response;
}
```

### 4. 客户端Hooks保持不变

```typescript
// hooks.ts继续使用统一的apiRequest实例
export function useApiQuery(...) {
  // 使用apiRequest（自动处理客户端token）
  const response = await apiRequest.get(url, options).json<TData>();
}
```

## 验收标准

1. ✅ 服务端组件可直接使用`get/post/put/patch/del`函数进行数据获取
2. ✅ 客户端组件继续使用React Query hooks正常工作
3. ✅ 认证token在服务端通过headers传入，客户端自动从localStorage获取
4. ✅ 所有现有功能保持不变
5. ✅ 类型安全完整
6. ✅ 文件重命名完成：`client.ts` → `request.ts`
7. ✅ 函数重命名完成：`createApiClient` → `createApiRequest`，`apiClient` → `apiRequest`
8. ✅ 所有引用已更新

## 风险与回滚

- **风险**：重构可能影响现有功能
- **回滚**：使用git revert回退到上一个提交

## 实施计划

1. ✅ 重构`client.ts`为`request.ts`，支持SSR
2. ✅ 重命名函数：`createApiClient` → `createApiRequest`，`apiClient` → `apiRequest`
3. ✅ 实现便捷函数：`get/post/put/patch/del`，支持服务端和客户端
4. ✅ 更新`hooks.ts`使用新的`apiRequest`实例
5. ✅ 更新`products.ts`提供服务端数据获取函数
6. ✅ 更新所有引用
7. ✅ 更新文档（`docs/api-request.md`、`README-ARCHITECTURE.md`）
8. ✅ 测试服务端和客户端场景
9. ✅ 验证类型检查通过

## 实际实现细节

### 文件变更
- ✅ `src/lib/api/client.ts` → `src/lib/api/request.ts`（已重命名）
- ✅ `src/lib/api/index.ts`（更新导出）
- ✅ `src/lib/api/hooks.ts`（更新使用`apiRequest`）
- ✅ `src/features/products/api/products.ts`（添加服务端函数）
- ✅ `docs/api-request.md`（更新文档）
- ✅ `README-ARCHITECTURE.md`（更新架构说明）

### 核心实现
1. **`createApiRequest`函数**：创建支持SSR的ky客户端实例
2. **`apiRequest`实例**：默认客户端实例，自动从localStorage获取token
3. **便捷函数**：`get/post/put/patch/del`，支持通过options.headers传入服务端token
4. **Token处理**：服务端优先使用传入headers，客户端自动从localStorage获取

## 完成状态

✅ 所有任务已完成，变更已归档
