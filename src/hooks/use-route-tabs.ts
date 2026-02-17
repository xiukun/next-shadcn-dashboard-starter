'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRouteTabsStore, type RouteTab } from '@/stores/route-tabs-store';
import { navItems } from '@/config/nav-config';
import type { NavItem } from '@/types';

/**
 * 从导航配置中查找路由对应的菜单项
 */
function findNavItemByUrl(
  url: string,
  items: NavItem[] = navItems
): NavItem | null {
  for (const item of items) {
    // 精确匹配
    if (item.url === url) {
      return item;
    }
    // 递归查找子菜单
    if (item.items && item.items.length > 0) {
      const found = findNavItemByUrl(url, item.items);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 路由 Tabs Hook
 * 监听路由变化，自动创建/激活对应的 Tab
 */
export function useRouteTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { tabs, activeTabId, addTab, setActiveTab, hasTab, updateTabUrl } =
    useRouteTabsStore();

  // 监听路由变化，自动创建/激活 Tab
  useEffect(() => {
    // 跳过非 dashboard 路由
    if (!pathname.startsWith('/dashboard')) {
      return;
    }

    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // 如果当前路由已有 Tab，只激活它
    if (hasTab(pathname)) {
      setActiveTab(pathname);
      // 同步最新 url（包含 query 参数），避免切回 tab 丢参
      updateTabUrl(pathname, fullUrl);
      return;
    }

    // 从导航配置中查找对应的菜单项
    const navItem = findNavItemByUrl(pathname);

    if (navItem) {
      const tab: RouteTab = {
        id: pathname,
        title: navItem.title,
        url: fullUrl,
        icon: navItem.icon,
        // 默认页不可关闭，其他页面可关闭
        closable: pathname !== '/dashboard/overview'
      };
      addTab(tab);
    } else {
      // 如果导航配置中没有找到，根据路径生成标题
      const segments = pathname.split('/').filter(Boolean);
      const title =
        segments.length > 1
          ? segments[segments.length - 1]
              .split('-')
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(' ')
          : 'Dashboard';

      const tab: RouteTab = {
        id: pathname,
        title,
        url: fullUrl,
        closable: pathname !== '/dashboard/overview'
      };
      addTab(tab);
    }
  }, [pathname, searchParams, addTab, setActiveTab, hasTab, updateTabUrl]);

  // 切换到指定路由
  const switchToTab = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      router.push(tab.url);
    }
  };

  return {
    tabs,
    activeTabId,
    switchToTab
  };
}
