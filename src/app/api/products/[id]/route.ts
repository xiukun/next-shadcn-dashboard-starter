/**
 * Single Product API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { fakeProducts } from '@/constants/mock-api';
import type { ApiResponse } from '@/lib/api/types';
import type { Product } from '@/constants/mock-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Invalid product ID',
        time: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const result = await fakeProducts.getProductById(productId);

    if (!result.success) {
      const errorResponse: ApiResponse = {
        success: false,
        error: result.message,
        time: result.time
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<{ product: Product }> = {
      success: true,
      data: { product: result.product! },
      message: result.message,
      time: result.time
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
