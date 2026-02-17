/**
 * API 错误处理工具
 */

import { ApiError } from './types';

/**
 * 从 HTTP 响应创建 ApiError
 */
export function createApiError(
  status: number,
  statusText: string,
  data?: unknown
): ApiError {
  let message = statusText;

  // 尝试从响应数据中提取错误消息
  if (data && typeof data === 'object') {
    const errorData = data as Record<string, unknown>;
    if (typeof errorData.message === 'string') {
      message = errorData.message;
    } else if (typeof errorData.error === 'string') {
      message = errorData.error;
    }
  }

  return new ApiError(status, statusText, data, message);
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch')
    );
  }
  return false;
}

/**
 * 判断是否为 API 错误
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 获取错误消息
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
