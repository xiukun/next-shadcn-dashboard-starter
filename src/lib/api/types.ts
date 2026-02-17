/**
 * API 相关类型定义
 */

/**
 * 标准 API 响应结构
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  time?: string;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    message?: string
  ) {
    super(message || statusText);
    this.name = 'ApiError';
  }
}

/**
 * HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * 请求配置
 */
export interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: number;
}
