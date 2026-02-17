/**
 * Mock API Handlers - 用于开发环境的请求拦截
 *
 * 注意：这是一个可选的 mock 方案。如果使用 MSW (Mock Service Worker)，
 * 可以在这里配置请求拦截器。
 */

import type { ApiResponse } from './types';

/**
 * Mock 响应配置
 */
export interface MockConfig {
  enabled: boolean;
  delay?: number;
}

/**
 * 默认 mock 配置
 */
export const defaultMockConfig: MockConfig = {
  enabled:
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_MOCK === 'true',
  delay: 500 // 模拟网络延迟
};

/**
 * 创建 mock 响应
 */
export function createMockResponse<T>(
  data: T,
  success = true,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    message: message || (success ? 'Success' : 'Error'),
    time: new Date().toISOString()
  };
}

/**
 * 模拟网络延迟
 */
export async function mockDelay(ms = defaultMockConfig.delay): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms || 0));
}
