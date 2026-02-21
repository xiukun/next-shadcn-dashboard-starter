import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * 根级别的 404 页面
 * 由于项目使用 [locale] 路由，根级别的 404 应该重定向到默认语言的 404
 */
export default function RootNotFound() {
  // 重定向到默认语言的 404 页面
  redirect(`/${routing.defaultLocale}/not-found`);
}
