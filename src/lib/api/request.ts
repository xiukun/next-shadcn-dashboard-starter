/**
 * HTTP 请求封装 - 基于 ky
 *
 * 支持服务端渲染（SSR）和客户端渲染的统一API请求工具
 * - 服务端：通过headers参数传入认证token
 * - 客户端：自动从localStorage获取认证token
 */

import ky, { type KyInstance, type Options as KyOptions } from 'ky';
import { ApiError, type ApiResponse } from './types';
import { createApiError } from './errors';

// 导出 KyOptions 类型供其他模块使用
export type { KyOptions };

/**
 * API请求配置选项
 */
export interface ApiRequestOptions {
  /** 基础URL，默认为环境变量NEXT_PUBLIC_API_URL或空字符串 */
  baseUrl?: string;
  /** 自定义请求头（服务端使用，如认证token） */
  headers?: Record<string, string>;
}

/**
 * 创建 API 请求客户端实例
 *
 * @param options - 请求配置选项
 * @returns ky客户端实例
 *
 * @example
 * // 服务端使用（传入headers）
 * const client = createApiRequest({
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 *
 * @example
 * // 客户端使用（自动从localStorage获取token）
 * const client = createApiRequest();
 */
export function createApiRequest(options?: ApiRequestOptions): KyInstance {
  const prefixUrl = options?.baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
  const customHeaders = options?.headers || {};

  const kyOptions: KyOptions = {
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ['get', 'put', 'head', 'delete', 'options', 'trace'],
      statusCodes: [408, 413, 429, 500, 502, 503, 504]
    },
    hooks: {
      beforeRequest: [
        async (request) => {
          // 优先使用传入的headers（服务端场景）
          if (customHeaders.Authorization) {
            request.headers.set('Authorization', customHeaders.Authorization);
          } else {
            // 客户端场景：从localStorage获取token
            // 仅在浏览器环境中执行
            if (typeof window !== 'undefined') {
              const token = localStorage.getItem('auth_token');
              if (token) {
                request.headers.set('Authorization', `Bearer ${token}`);
              }
            }
          }

          // 设置其他自定义headers
          Object.entries(customHeaders).forEach(([key, value]) => {
            if (key !== 'Authorization') {
              request.headers.set(key, value);
            }
          });

          // 设置Content-Type
          if (!request.headers.has('Content-Type')) {
            request.headers.set('Content-Type', 'application/json');
          }
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
    return ky.create({ ...kyOptions, prefixUrl });
  }

  return ky.create(kyOptions);
}

/**
 * 默认 API 请求客户端实例（客户端使用，自动从localStorage获取token）
 */
export const apiRequest = createApiRequest();

/**
 * 类型安全的 GET 请求
 *
 * 支持服务端和客户端使用：
 * - 服务端：传入headers选项包含认证token
 * - 客户端：自动从localStorage获取token
 *
 * @example
 * // 服务端使用
 * const data = await get('/api/products', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 *
 * @example
 * // 客户端使用
 * const data = await get('/api/products');
 */
export async function get<T = unknown>(
  url: string,
  options?: KyOptions & { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  // 如果传入了headers，创建新的请求客户端实例
  const client = options?.headers
    ? createApiRequest({ headers: options.headers })
    : apiRequest;

  // 移除headers，因为已经在请求客户端实例中处理
  const { headers, ...restOptions } = options || {};
  const response = await client.get(url, restOptions).json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 POST 请求
 *
 * @example
 * // 服务端使用
 * const result = await post('/api/products', productData, {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 */
export async function post<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions & { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const client = options?.headers
    ? createApiRequest({ headers: options.headers })
    : apiRequest;

  const { headers, ...restOptions } = options || {};
  const response = await client
    .post(url, { json: body, ...restOptions })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 PUT 请求
 */
export async function put<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions & { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const client = options?.headers
    ? createApiRequest({ headers: options.headers })
    : apiRequest;

  const { headers, ...restOptions } = options || {};
  const response = await client
    .put(url, { json: body, ...restOptions })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 PATCH 请求
 */
export async function patch<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: KyOptions & { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const client = options?.headers
    ? createApiRequest({ headers: options.headers })
    : apiRequest;

  const { headers, ...restOptions } = options || {};
  const response = await client
    .patch(url, { json: body, ...restOptions })
    .json<ApiResponse<T>>();
  return response;
}

/**
 * 类型安全的 DELETE 请求
 */
export async function del<T = unknown>(
  url: string,
  options?: KyOptions & { headers?: Record<string, string> }
): Promise<ApiResponse<T>> {
  const client = options?.headers
    ? createApiRequest({ headers: options.headers })
    : apiRequest;

  const { headers, ...restOptions } = options || {};
  const response = await client.delete(url, restOptions).json<ApiResponse<T>>();
  return response;
}
