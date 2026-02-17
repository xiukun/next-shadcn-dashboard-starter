'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { RouteTabs } from './route-tabs';
import { Breadcrumbs } from '../breadcrumbs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { SettingsPanel } from './settings-panel';
import { useUserPreferencesStore } from '@/lib/user-preferences-store';
import { useRouteTabsStore } from '@/lib/route-tabs-store';
import { Button } from '../ui/button';
import { Icons } from '../icons';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const rightActionsRef = useRef<HTMLDivElement>(null);
  const [rightActionsWidth, setRightActionsWidth] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { enableTabs } = useUserPreferencesStore();

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useUserPreferencesStore.persist.rehydrate();
    // 确保 F5 刷新后 tabs 也能从 localStorage 恢复（route-tabs-store 设置了 skipHydration: true）
    useRouteTabsStore.persist.rehydrate();
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
        <UserNav />
        <Button
          variant='ghost'
          size='icon'
          className='h-9 w-9'
          onClick={() => setSettingsOpen(true)}
        >
          <Icons.settings className='h-4 w-4' />
          <span className='sr-only'>设置</span>
        </Button>
      </div>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
