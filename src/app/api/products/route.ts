/**
 * Products API Route
 *
 * 使用 mock 数据的产品 API 端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { fakeProducts } from '@/constants/mock-api';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Product } from '@/constants/mock-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const categories = searchParams.get('categories') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await fakeProducts.getProducts({
      page,
      limit,
      categories,
      search
    });

    const response: PaginatedResponse<Product> = {
      success: true,
      data: result.products,
      message: result.message,
      time: result.time,
      total: result.total_products,
      page: result.offset / result.limit + 1,
      limit: result.limit,
      offset: result.offset
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      time: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
