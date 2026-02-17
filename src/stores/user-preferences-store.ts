import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  /**
   * 是否启用标签栏
   * 默认值: true
   * 当为 true 时，显示 RouteTabs 组件
   * 当为 false 时，显示 Breadcrumbs 组件
   */
  enableTabs: boolean;

  /**
   * 是否显示面包屑
   * 默认值: true
   * 当 enableTabs 为 false 时，此设置生效
   * 当 enableTabs 为 true 时，此设置被忽略
   */
  showBreadcrumbs: boolean;

  /**
   * 面包屑样式
   * 默认值: 'regular'
   * 'regular': 常规样式（无背景）
   * 'background': 背景样式（有背景色）
   */
  breadcrumbStyle: 'regular' | 'background';

  /**
   * 侧边栏折叠模式
   * 默认值: 'icon'
   * 'icon': 图标模式，折叠时只显示图标，子菜单隐藏
   * 'expanded-submenu': 展开子项模式，折叠时显示图标和所有子菜单项
   */
  sidebarCollapseMode: 'icon' | 'expanded-submenu';

  /**
   * 是否启用页面缓存（Keep-Alive）
   * 默认值: true
   * 当为 true 时，切换标签页时保留页面状态和 DOM 结构
   * 当为 false 时，切换标签页时重新渲染页面
   */
  enableKeepAlive: boolean;
}

interface UserPreferencesStore extends UserPreferences {
  setEnableTabs: (value: boolean) => void;
  setShowBreadcrumbs: (value: boolean) => void;
  setBreadcrumbStyle: (value: 'regular' | 'background') => void;
  setSidebarCollapseMode: (value: 'icon' | 'expanded-submenu') => void;
  setEnableKeepAlive: (value: boolean) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  enableTabs: true,
  showBreadcrumbs: true,
  breadcrumbStyle: 'regular',
  sidebarCollapseMode: 'icon',
  enableKeepAlive: true
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      setEnableTabs: (value: boolean) => {
        set({ enableTabs: value });
      },

      setShowBreadcrumbs: (value: boolean) => {
        set({ showBreadcrumbs: value });
      },

      setBreadcrumbStyle: (value: 'regular' | 'background') => {
        set({ breadcrumbStyle: value });
      },

      setSidebarCollapseMode: (value: 'icon' | 'expanded-submenu') => {
        set({ sidebarCollapseMode: value });
      },

      setEnableKeepAlive: (value: boolean) => {
        set({ enableKeepAlive: value });
      }
    }),
    {
      name: 'user-preferences-store',
      skipHydration: true // 跳过 SSR 时的 hydration，避免不匹配
    }
  )
);
