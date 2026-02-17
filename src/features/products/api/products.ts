/**
 * Products API - 支持服务端和客户端数据获取
 *
 * - 服务端：使用 fetchProducts 函数（在服务端组件中直接调用）
 * - 客户端：使用 React Query hooks（在客户端组件中使用）
 */

import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import { get, post, put, del } from '@/lib/api/request';
import type { Product } from '@/constants/mock-api';
import type { PaginatedResponse } from '@/lib/api/types';

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
}

/**
 * 服务端数据获取函数
 *
 * 在服务端组件中直接使用，例如：
 * ```tsx
 * export default async function Page() {
 *   const response = await fetchProducts({ page: 1, limit: 10 });
 *   if (!response.success || !response.data) {
 *     return <div>Error loading products</div>;
 *   }
 *   return <ProductList data={response.data} />;
 * }
 * ```
 */
export async function fetchProducts(
  params?: ProductsQueryParams,
  options?: { headers?: Record<string, string> }
): Promise<PaginatedResponse<Product>> {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.categories) queryParams.set('categories', params.categories);
  if (params?.search) queryParams.set('search', params.search);

  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ''}`;

  // API返回的是PaginatedResponse<Product>，get函数会包装成ApiResponse<PaginatedResponse<Product>>
  const response = await get<PaginatedResponse<Product>>(url, options);

  // 如果响应不成功，抛出错误
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch products');
  }

  // 解包：response.data是PaginatedResponse<Product>，直接返回
  return response.data;
}

/**
 * 获取单个产品（服务端）
 */
export async function fetchProduct(
  id: number,
  options?: { headers?: Record<string, string> }
): Promise<Product> {
  const response = await get<{ product: Product }>(
    `/api/products/${id}`,
    options
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch product');
  }

  return response.data.product;
}

/**
 * 创建产品（服务端）
 */
export async function createProduct(
  data: Partial<Product>,
  options?: { headers?: Record<string, string> }
): Promise<Product> {
  const response = await post<Product, Partial<Product>>(
    '/api/products',
    data,
    options
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create product');
  }

  return response.data;
}

/**
 * 更新产品（服务端）
 */
export async function updateProduct(
  id: number,
  data: Partial<Product>,
  options?: { headers?: Record<string, string> }
): Promise<Product> {
  const response = await put<Product, Partial<Product>>(
    `/api/products/${id}`,
    data,
    options
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update product');
  }

  return response.data;
}

/**
 * 删除产品（服务端）
 */
export async function deleteProduct(
  id: number,
  options?: { headers?: Record<string, string> }
): Promise<void> {
  const response = await del(`/api/products/${id}`, options);

  if (!response.success) {
    throw new Error(response.error || 'Failed to delete product');
  }
}

/**
 * 客户端 Hooks - 仅在客户端组件中使用
 *
 * 注意：这些hooks只能在客户端组件中使用（'use client'）
 * 服务端组件应使用上面的 fetchProducts 等函数
 */

export function useProducts(params?: ProductsQueryParams) {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.categories) queryParams.set('categories', params.categories);
  if (params?.search) queryParams.set('search', params.search);

  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ''}`;

  return useApiQuery<PaginatedResponse<Product>>(['products', params], url, {
    staleTime: 1000 * 60 * 2
  });
}

export function useProduct(id: number) {
  return useApiQuery<{ product: Product }>(
    ['product', id],
    `/api/products/${id}`,
    {
      staleTime: 1000 * 60 * 5
    }
  );
}

export function useCreateProduct() {
  return useApiMutation<Product, Partial<Product>>('/api/products', 'POST');
}

export function useUpdateProduct(id: number) {
  return useApiMutation<Product, Partial<Product>>(
    `/api/products/${id}`,
    'PUT'
  );
}

export function useDeleteProduct() {
  return useApiMutation<void, number>('/api/products', 'DELETE');
}
