/**
 * HTTP 客户端封装 - 基于 ky
 */

import ky, { type KyInstance, type Options as KyOptions } from 'ky';
import { ApiError, type ApiResponse } from './types';
import { createApiError } from './errors';

// 导出 KyOptions 类型供其他模块使用
export type { KyOptions };

/**
 * 创建 API 客户端实例
 */
export function createApiClient(baseUrl?: string): KyInstance {
  const prefixUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';

  const options: KyOptions = {
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504]
    },
    hooks: {
      beforeRequest: [
        async (request) => {
          const token =
            typeof window !== 'undefined'
              ? localStorage.getItem('auth_token')
              : null;

          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }

          request.headers.set('Content-Type', 'application/json');
        }
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (!response.ok) {
            let errorData: unknown;
            try {
              errorData = await response.json();
            } catch {
              errorData = await response.text();
            }
            throw createApiError(
              response.status,
              response.statusText,
              errorData
            );
          }
        }
      ],
      beforeError: [
        async (error) => {
          if (error.message.includes('fetch')) {
            throw new ApiError(
              0,
              'Network Error',
              null,
              'Network request failed. Please check your connection.'
            );
          }
          return error;
        }
      ]
    }
  };

  if (prefixUrl) {
    return ky.create({ ...options, prefixUrl });
  }

  return ky.create(options);
}

/**
 * 默认 API 客户端实例
 */
export const apiClient = createApiClient();

/**
 * 类型安全的 GET 请求
 */
export async function get<T = unknown>(
  url: string,
  options?: KyOptions
): Promise<ApiResponse<T>> {
  const response = await apiClient.get(url, options).json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 POST 请求
 */
export async function post<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions
): Promise<ApiResponse<T>> {
  const response = await apiClient
    .post(url, { json: body, ...options })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 PUT 请求
 */
export async function put<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions
): Promise<ApiResponse<T>> {
  const response = await apiClient
    .put(url, { json: body, ...options })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 PATCH 请求
 */
export async function patch<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions
): Promise<ApiResponse<T>> {
  const response = await apiClient
    .patch(url, { json: body, ...options })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 DELETE 请求
 */
export async function del<T = unknown>(
  url: string,
  options?: KyOptions
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete(url, options).json<ApiResponse<T>>();
  return response;
}
