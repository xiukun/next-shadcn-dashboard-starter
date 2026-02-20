import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always' // 始终显示语言前缀
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
