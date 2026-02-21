'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRouteTabsStore, type RouteTab } from '@/stores/route-tabs-store';
import { useTranslatedNavItems } from './use-translated-nav-items';
import type { NavItem } from '@/types';
import { routing } from '@/i18n/routing';

/**
 * 从导航配置中查找路由对应的菜单项
 * 支持带 locale 的 URL（如 /zh/dashboard/overview）
 */
function findNavItemByUrl(url: string, items: NavItem[]): NavItem | null {
  // 移除 locale 前缀进行比较（如 /zh/dashboard -> /dashboard）
  const normalizedUrl = url.replace(/^\/[^/]+/, '') || '/';

  for (const item of items) {
    // 移除 item.url 中的 locale 前缀进行比较
    const normalizedItemUrl = item.url.replace(/^\/[^/]+/, '') || '/';

    // 精确匹配
    if (normalizedItemUrl === normalizedUrl) {
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
 * 规范化用于 Tabs 与缓存的路由路径
 * - 当路径形如 /{locale}/dashboard/... 且 locale 在 routing.locales 中时
 *   使用去除 locale 前缀后的 canonical path（例如 /en/dashboard/overview -> /dashboard/overview）
 * - 其他情况下返回原始 pathname
 */
function normalizePathForTabs(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return pathname;

  const maybeLocale = segments[0];
  if (routing.locales.includes(maybeLocale as any)) {
    const rest = segments.slice(1);
    if (rest.length === 0) {
      return '/';
    }
    return `/${rest.join('/')}`;
  }

  return pathname;
}

/**
 * 路由 Tabs Hook
 * 监听路由变化，自动创建/激活对应的 Tab
 */
export function useRouteTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    addTab,
    setActiveTab,
    pendingNavigation,
    setPendingNavigation
  } = useRouteTabsStore();
  const translatedNavItems = useTranslatedNavItems();
  const canonicalPath = normalizePathForTabs(pathname);

  // 监听路由变化，自动创建/激活 Tab
  useEffect(() => {
    // 跳过非 dashboard 路由（使用 canonical path 判断，支持多语言前缀）
    if (!canonicalPath.startsWith('/dashboard')) {
      // 清除 pendingNavigation（如果存在）
      if (pendingNavigation) {
        setPendingNavigation(null);
      }
      return;
    }

    const {
      tabs: currentTabs,
      activeTabId: currentActiveTabId,
      pendingNavigation: currentPendingNavigation
    } = useRouteTabsStore.getState();

    // 如果当前路由正在跳转中（pendingNavigation 存在且不等于当前 canonicalPath），
    // 说明这是路由跳转过程中的中间状态，不应该重新创建 Tab
    // 只有当 pendingNavigation 等于当前 canonicalPath 时，才表示跳转完成，可以清除 pendingNavigation
    if (
      currentPendingNavigation &&
      currentPendingNavigation !== canonicalPath
    ) {
      // 正在跳转到其他路由，当前路由不应该重新创建 Tab
      return;
    }

    // 如果 pendingNavigation 等于当前 canonicalPath，说明跳转已完成，清除 pendingNavigation
    if (currentPendingNavigation === canonicalPath) {
      setPendingNavigation(null);
    }

    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${pathname}?${queryString}` : pathname;

    const existingTab = currentTabs.find((t) => t.id === canonicalPath);

    // 从导航配置中查找对应的菜单项
    const navItem = findNavItemByUrl(pathname, translatedNavItems);

    let nextTab: RouteTab;

    if (navItem) {
      nextTab = {
        // 使用 canonical path 作为 Tab ID，确保多语言下同一路由共用一个 Tab
        id: canonicalPath,
        title: navItem.title,
        url: fullUrl,
        icon: navItem.icon,
        // 默认页不可关闭，其他页面可关闭
        closable: canonicalPath !== '/dashboard/overview'
      };
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

      nextTab = {
        id: canonicalPath,
        title,
        url: fullUrl,
        closable: canonicalPath !== '/dashboard/overview'
      };
    }

    if (existingTab) {
      // 确保当前路由对应的 Tab 处于激活状态
      if (currentActiveTabId !== canonicalPath) {
        setActiveTab(canonicalPath);
      }

      // 如果已存在 Tab，且标题 / 图标 / URL 都一致，则不触发更新，避免无限循环
      if (
        existingTab.title === nextTab.title &&
        existingTab.icon === nextTab.icon &&
        existingTab.url === nextTab.url
      ) {
        return;
      }
    }

    addTab(nextTab);
  }, [
    pathname,
    canonicalPath,
    searchParams,
    addTab,
    setActiveTab,
    translatedNavItems,
    pendingNavigation,
    setPendingNavigation
  ]);

  // 切换到指定路由
  const switchToTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      // 设置 pendingNavigation，防止在路由跳转期间重新创建 Tab
      setPendingNavigation(tabId);
      router.push(tab.url);
    }
  };

  return {
    tabs,
    activeTabId,
    switchToTab
  };
}
