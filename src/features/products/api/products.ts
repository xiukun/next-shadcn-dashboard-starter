/**
 * Products API Hooks
 *
 * 使用 React Query 和 ky 客户端的产品数据获取
 */

import { useApiQuery, useApiMutation } from '@/lib/api/hooks';
import type { Product } from '@/constants/mock-api';
import type { PaginatedResponse } from '@/lib/api/types';

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
}

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
