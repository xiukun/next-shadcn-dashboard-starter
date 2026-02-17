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
}

interface UserPreferencesStore extends UserPreferences {
  setEnableTabs: (value: boolean) => void;
  setShowBreadcrumbs: (value: boolean) => void;
  setBreadcrumbStyle: (value: 'regular' | 'background') => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  enableTabs: true,
  showBreadcrumbs: true,
  breadcrumbStyle: 'regular'
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
      }
    }),
    {
      name: 'user-preferences-store',
      skipHydration: true // 跳过 SSR 时的 hydration，避免不匹配
    }
  )
);
