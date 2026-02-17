import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey
} from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ApiError, ApiResponse } from './types';
import { apiClient, type KyOptions } from './client';

export function useApiQuery<TData = unknown, TError = ApiError>(
  queryKey: QueryKey,
  url: string,
  options?: KyOptions &
    Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get(url, options).json<TData>();
      return response;
    },
    ...options
  });
}

/**
 * 使用 API Mutation
 */
export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = ApiError
>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseMutationOptions<ApiResponse<TData>, TError, TVariables>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation<ApiResponse<TData>, TError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      let response: ApiResponse<TData>;

      switch (method) {
        case 'POST':
          response = await apiClient
            .post(url, { json: variables })
            .json<ApiResponse<TData>>();
          break;
        case 'PUT':
          response = await apiClient
            .put(url, { json: variables })
            .json<ApiResponse<TData>>();
          break;
        case 'PATCH':
          response = await apiClient
            .patch(url, { json: variables })
            .json<ApiResponse<TData>>();
          break;
        case 'DELETE':
          response = await apiClient
            .delete(url, { json: variables })
            .json<ApiResponse<TData>>();
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return response;
    },
    ...options
  });

  // 在 React Query v5 中，onSuccess 已被移除，使用 useEffect 处理查询失效
  useEffect(() => {
    if (mutation.isSuccess) {
      // 默认情况下，成功后使相关查询失效
      queryClient.invalidateQueries();
    }
  }, [mutation.isSuccess, queryClient]);

  return mutation;
}

/**
 * 使用 API Query 并返回数据（自动解包）
 */
export function useApiQueryData<TData = unknown, TError = ApiError>(
  queryKey: QueryKey,
  url: string,
  options?: KyOptions &
    Omit<UseQueryOptions<ApiResponse<TData>, TError>, 'queryKey' | 'queryFn'>
) {
  const query = useApiQuery<ApiResponse<TData>, TError>(queryKey, url, options);

  return {
    ...query,
    data: query.data?.data,
    isSuccess: query.isSuccess && query.data?.success === true
  };
}
