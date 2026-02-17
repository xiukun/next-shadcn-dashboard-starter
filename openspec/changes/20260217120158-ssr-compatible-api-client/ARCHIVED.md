# 变更归档：SSR兼容的统一API客户端重构

## Change ID

`20260217120158-ssr-compatible-api-client`

## 归档日期

2025-02-17

## 变更摘要

成功重构API客户端架构，实现SSR兼容的统一HTTP请求工具，支持服务端和客户端同时使用。

## 实现成果

### 核心变更

1. **文件重命名**
   - `src/lib/api/client.ts` → `src/lib/api/request.ts`
   - 更准确地反映其作为请求工具的本质

2. **函数重命名**
   - `createApiClient` → `createApiRequest`
   - `apiClient` → `apiRequest`

3. **便捷函数实现**
   - `get<T>(url, options?)` - GET请求
   - `post<T, TBody>(url, body?, options?)` - POST请求
   - `put<T, TBody>(url, body?, options?)` - PUT请求
   - `patch<T, TBody>(url, body?, options?)` - PATCH请求
   - `del<T>(url, options?)` - DELETE请求

4. **Token处理机制**
   - 服务端：通过`options.headers`传入认证token
   - 客户端：自动从`localStorage.getItem('auth_token')`获取
   - 仅在浏览器环境（`typeof window !== 'undefined'`）中访问localStorage

### 文件变更清单

#### 修改文件
- ✅ `src/lib/api/request.ts` - 重构为SSR兼容的统一请求工具
- ✅ `src/lib/api/hooks.ts` - 更新使用`apiRequest`实例
- ✅ `src/lib/api/index.ts` - 更新导出
- ✅ `src/features/products/api/products.ts` - 添加服务端数据获取函数`fetchProducts`
- ✅ `docs/api-request.md` - 更新文档说明
- ✅ `README-ARCHITECTURE.md` - 更新架构说明

#### 删除文件
- ✅ `src/lib/api/client.ts` - 已重命名为`request.ts`

### 功能验证

#### 服务端使用
```typescript
// 服务端组件中直接使用
export default async function Page() {
  const data = await get<Product[]>('/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return <ProductList data={data} />;
}
```

#### 客户端使用
```typescript
// 客户端组件中使用React Query hooks
'use client';
export function ProductList() {
  const { data, isLoading } = useProductsQuery();
  // 自动从localStorage获取token
}
```

#### 服务端数据获取函数
```typescript
// products.ts中提供的服务端函数
export async function fetchProducts(
  params?: ProductsQueryParams,
  options?: { headers?: Record<string, string> }
): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>('/api/products', options);
}
```

### 代码质量验证

- ✅ TypeScript类型检查通过
- ✅ ESLint检查通过
- ✅ 代码格式化完成
- ✅ 所有引用已更新
- ✅ 文档已更新

### 符合规范验证

根据`openspec/specs/api-client/spec.md`规范验证：

1. ✅ **SSR兼容的统一HTTP客户端**：实现`createApiRequest`函数，支持服务端和客户端
2. ✅ **服务端使用场景**：可通过`get/post/put/del`函数，通过headers传入token
3. ✅ **客户端使用场景**：自动从localStorage获取token，支持React Query hooks
4. ✅ **Token处理**：服务端通过headers传入，客户端自动获取
5. ✅ **类型安全**：所有函数提供完整的TypeScript类型定义
6. ✅ **命名规范**：使用`request`而非`client`
7. ✅ **环境检测**：使用`typeof window !== 'undefined'`判断客户端环境

## 技术亮点

1. **统一架构**：单个文件同时支持服务端和客户端使用
2. **智能Token处理**：服务端优先使用传入headers，客户端自动从localStorage获取
3. **类型安全**：完整的TypeScript类型支持
4. **便捷函数**：提供类型安全的`get/post/put/patch/del`函数
5. **向后兼容**：客户端hooks继续正常工作

## 后续建议

1. 考虑添加请求缓存机制（服务端）
2. 考虑添加请求重试策略配置
3. 考虑添加请求日志记录（开发环境）

## 相关文档

- 提案：`proposal.md`
- 任务清单：`tasks.md`
- 规范：`specs/api-client/spec.md`
- API文档：`docs/api-request.md`
- 架构文档：`README-ARCHITECTURE.md`

---

**状态**：✅ 已完成并归档
