import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // 对 API / TRPC 路由跳过 next-intl，中间件仅用于页面路由
  // 原因：next-intl 中间件会处理语言检测和重定向，但 API 路由不需要语言前缀
  // 如果 API 路由也被 next-intl 处理，会导致 404 错误（如 /api/products 被错误重写）
  if (!pathname.startsWith('/api') && !pathname.startsWith('/trpc')) {
    // 先处理 next-intl 语言检测和重定向
    const intlResponse = intlMiddleware(req);
    if (intlResponse) {
      return intlResponse;
    }
  }

  // 然后处理 Clerk 认证
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
