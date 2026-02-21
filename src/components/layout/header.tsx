'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { RouteTabs } from './route-tabs';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { SettingsPanel } from './settings-panel';
import { NotificationPanel } from './notification-panel';
import { LanguageSwitcherButton } from './language-switcher-button';
import { useUserPreferencesStore } from '@/stores/user-preferences-store';
import { useRouteTabsStore } from '@/stores/route-tabs-store';
import {
  useFullscreenStore,
  initFullscreenListeners
} from '@/stores/fullscreen-store';
import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Icons } from '../icons';
import { useTranslations } from 'next-intl';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const rightActionsRef = useRef<HTMLDivElement>(null);
  const [rightActionsWidth, setRightActionsWidth] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { enableTabs } = useUserPreferencesStore();
  const { isFullscreen, toggleFullscreen } = useFullscreenStore();
  const { unreadCount } = useNotificationStore();
  const t = useTranslations('common');

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useUserPreferencesStore.persist.rehydrate();
    // 确保 F5 刷新后 tabs 也能从 localStorage 恢复（route-tabs-store 设置了 skipHydration: true）
    useRouteTabsStore.persist.rehydrate();
    // 触发通知 store 的 hydration
    useNotificationStore.persist.rehydrate();
    // 初始化全屏事件监听器
    const cleanup = initFullscreenListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!rightActionsRef.current) return;

    const updateWidth = () => {
      if (rightActionsRef.current) {
        setRightActionsWidth(rightActionsRef.current.offsetWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(rightActionsRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className='grid h-16 shrink-0 grid-cols-[1fr_auto] items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
    >
      {/* 左侧区域：SidebarTrigger + Separator + Tabs */}
      <div className='flex min-w-0 items-center overflow-hidden'>
        <div className='flex shrink-0 items-center gap-2 px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='h-4' />
        </div>
        <div
          className='flex min-w-0 flex-1 items-center overflow-hidden'
          style={{
            maxWidth:
              rightActionsWidth > 0
                ? `calc(100vw - ${rightActionsWidth}px - 4rem)`
                : '100%'
          }}
        >
          {mounted && enableTabs ? (
            <RouteTabs availableWidth={rightActionsWidth} />
          ) : mounted ? (
            <Breadcrumbs />
          ) : null}
        </div>
      </div>

      {/* 右侧区域：搜索、用户、主题等 - 固定宽度，不被压缩 */}
      <div
        ref={rightActionsRef}
        className='flex shrink-0 items-center gap-2 px-4'
        style={{ minWidth: 'max-content' }}
      >
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <LanguageSwitcherButton />
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9'
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? (
            <Icons.fullscreenExit className='h-4 w-4' />
          ) : (
            <Icons.fullscreen className='h-4 w-4' />
          )}
          <span className='sr-only'>{isFullscreen ? '退出全屏' : '全屏'}</span>
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='relative h-9 w-9'
          onClick={() => setNotificationOpen(true)}
          title={t('notifications')}
        >
          <Icons.bell className='h-4 w-4' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className='sr-only'>{t('notifications')}</span>
        </Button>
        <UserNav />
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9'
          onClick={() => setSettingsOpen(true)}
        >
          <Icons.settings className='h-4 w-4' />
          <span className='sr-only'>{t('settings')}</span>
        </Button>
      </div>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      <NotificationPanel
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
      />
    </header>
  );
}
