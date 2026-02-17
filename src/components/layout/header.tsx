'use client';

import React, { useRef, useEffect, useState } from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { RouteTabs } from './route-tabs';
import SearchInput from '../search-input';
import { UserNav } from './user-nav';
import { ThemeSelector } from '../themes/theme-selector';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const rightActionsRef = useRef<HTMLDivElement>(null);
  const [rightActionsWidth, setRightActionsWidth] = useState(0);

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
          <RouteTabs availableWidth={rightActionsWidth} />
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
        <ThemeModeToggle />
        <ThemeSelector />
      </div>
    </header>
  );
}
