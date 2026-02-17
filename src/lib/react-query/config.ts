/**
 * React Query 配置
 */

import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

/**
 * 默认查询配置
 */
export const defaultQueryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // 数据在 5 分钟内被认为是新鲜的
      staleTime: 1000 * 60 * 5,
      // 数据在缓存中保留 10 分钟
      gcTime: 1000 * 60 * 10, // 原 cacheTime 在 v5 中改为 gcTime
      // 失败时重试 1 次
      retry: 1,
      // 窗口聚焦时不重新获取
      refetchOnWindowFocus: false,
      // 网络重连时重新获取
      refetchOnReconnect: true,
      // 挂载时不重新获取（如果数据已存在）
      refetchOnMount: true
    },
    mutations: {
      // 失败时重试 1 次
      retry: 1
    }
  }
};

/**
 * 创建 QueryClient 实例
 */
export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient({
    ...defaultQueryConfig,
    ...config
  });
}
