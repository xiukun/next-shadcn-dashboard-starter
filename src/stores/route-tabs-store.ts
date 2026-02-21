import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RouteTab {
  id: string; // 路由路径作为唯一ID
  title: string; // 显示标题
  url: string; // 路由路径
  icon?: string; // 图标名称
  closable?: boolean; // 是否可关闭（默认 true）
}

interface RouteTabsStore {
  tabs: RouteTab[];
  activeTabId: string | null;
  pendingNavigation: string | null; // 正在跳转的目标 canonical path（用于防止在跳转期间重新创建 Tab）
  addTab: (tab: RouteTab) => void;
  updateTabUrl: (tabId: string, url: string) => void;
  removeTab: (tabId: string) => string | null; // 返回新的激活标签页 ID
  setActiveTab: (tabId: string) => void;
  setPendingNavigation: (canonicalPath: string | null) => void; // 设置/清除正在跳转的目标路由
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  hasTab: (tabId: string) => boolean;
  resetTabs: () => void;
}

const DEFAULT_TAB: RouteTab = {
  id: '/dashboard/overview',
  title: '仪表盘',
  url: '/dashboard/overview',
  icon: 'dashboard',
  closable: false // 默认页不可关闭
};

const MAX_CLOSABLE_TABS = 8; // 最多8个可关闭的标签页

export const useRouteTabsStore = create<RouteTabsStore>()(
  persist(
    (set, get) => ({
      tabs: [DEFAULT_TAB],
      activeTabId: DEFAULT_TAB.id,
      pendingNavigation: null,

      addTab: (tab: RouteTab) => {
        const state = get();
        // 如果标签页已存在：激活它，并同步最新 url（包含 query 参数）
        if (state.hasTab(tab.id)) {
          set((prev) => ({
            activeTabId: tab.id,
            tabs: prev.tabs.map((t) =>
              t.id === tab.id
                ? {
                    ...t,
                    // 同步最新 url（包含 query 参数）
                    url: tab.url,
                    // 同步标题和图标，确保在切换语言后能够更新为翻译文案
                    title: tab.title ?? t.title,
                    icon: tab.icon ?? t.icon
                  }
                : t
            )
          }));
          return;
        }

        // 计算当前可关闭的标签页数量（排除默认页）
        const closableTabs = state.tabs.filter((t) => t.closable !== false);
        const newTabs = [...state.tabs];

        // 如果新标签是可关闭的，且当前可关闭标签数已达到上限，删除最早的可关闭标签
        if (
          tab.closable !== false &&
          closableTabs.length >= MAX_CLOSABLE_TABS
        ) {
          // 找到最早的可关闭标签页（排除默认页）
          const firstClosableIndex = newTabs.findIndex(
            (t) => t.closable !== false && t.id !== DEFAULT_TAB.id
          );
          if (firstClosableIndex !== -1) {
            newTabs.splice(firstClosableIndex, 1);
          }
        }

        // 添加新标签页
        newTabs.push(tab);
        set({
          tabs: newTabs,
          activeTabId: tab.id
        });
      },

      updateTabUrl: (tabId: string, url: string) => {
        set((prev) => ({
          tabs: prev.tabs.map((t) => (t.id === tabId ? { ...t, url } : t))
        }));
      },

      removeTab: (tabId: string) => {
        const state = get();
        const tab = state.tabs.find((t) => t.id === tabId);
        // 如果标签页不可关闭，则不执行删除
        if (tab && !tab.closable) {
          return state.activeTabId;
        }
        const newTabs = state.tabs.filter((t) => t.id !== tabId);
        // 如果删除的是当前激活的标签页，需要激活其他标签页
        let newActiveTabId = state.activeTabId;
        if (state.activeTabId === tabId) {
          // 优先激活右侧的标签页，如果没有则激活左侧的
          const currentIndex = state.tabs.findIndex((t) => t.id === tabId);
          if (currentIndex < newTabs.length) {
            newActiveTabId = newTabs[currentIndex].id;
          } else if (newTabs.length > 0) {
            newActiveTabId = newTabs[newTabs.length - 1].id;
          } else {
            // 如果所有标签页都被删除，激活默认标签页
            newActiveTabId = DEFAULT_TAB.id;
            newTabs.push(DEFAULT_TAB);
          }
        }
        set({
          tabs: newTabs,
          activeTabId: newActiveTabId
        });
        // 返回新的激活标签页 ID，用于路由跳转
        return newActiveTabId;
      },

      setActiveTab: (tabId: string) => {
        set({ activeTabId: tabId });
      },

      setPendingNavigation: (canonicalPath: string | null) => {
        set({ pendingNavigation: canonicalPath });
      },

      closeOtherTabs: (tabId: string) => {
        const state = get();
        const currentTab = state.tabs.find((t) => t.id === tabId);
        if (!currentTab) return;
        // 保留当前标签页和所有不可关闭的标签页
        const newTabs = state.tabs.filter((t) => t.id === tabId || !t.closable);
        set({
          tabs: newTabs,
          activeTabId: tabId
        });
      },

      closeAllTabs: () => {
        // 保留所有不可关闭的标签页，如果没有则添加默认标签页
        const state = get();
        const unclosableTabs = state.tabs.filter((t) => !t.closable);
        const newTabs =
          unclosableTabs.length > 0 ? unclosableTabs : [DEFAULT_TAB];
        set({
          tabs: newTabs,
          activeTabId: newTabs[0].id
        });
      },

      hasTab: (tabId: string) => {
        return get().tabs.some((t) => t.id === tabId);
      },

      resetTabs: () => {
        set({
          tabs: [DEFAULT_TAB],
          activeTabId: DEFAULT_TAB.id
        });
      }
    }),
    {
      name: 'route-tabs-store',
      skipHydration: true // 跳过 SSR 时的 hydration，避免不匹配
    }
  )
);
