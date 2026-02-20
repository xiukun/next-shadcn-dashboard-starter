'use client';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { navItems } from '@/config/nav-config';
import { NavItem } from '@/types';

/**
 * Hook to get translated navigation items
 * Translates the title of each nav item based on the current locale
 */
export function useTranslatedNavItems(): NavItem[] {
  const t = useTranslations('nav');
  const locale = useLocale();

  const translateNavItem = (item: NavItem): NavItem => {
    // 翻译键映射：将 title 转换为翻译键
    const titleKeyMap: Record<string, string> = {
      Dashboard: 'dashboard',
      Workspaces: 'workspaces',
      Teams: 'teams',
      Product: 'product',
      'Product (Client)': 'productClient',
      Kanban: 'kanban',
      Pro: 'pro',
      Exclusive: 'exclusive',
      Account: 'account',
      Profile: 'profile',
      Billing: 'billing',
      Login: 'login'
    };

    const titleKey = titleKeyMap[item.title];
    const translatedTitle = titleKey ? t(titleKey) : item.title;

    // 更新 URL 以包含 locale
    const translatedUrl = item.url.startsWith('/')
      ? `/${locale}${item.url}`
      : item.url;

    return {
      ...item,
      title: translatedTitle,
      url: translatedUrl,
      items: item.items?.map(translateNavItem)
    };
  };

  return navItems.map(translateNavItem);
}
