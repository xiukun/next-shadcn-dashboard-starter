'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouteTabs } from '@/hooks/use-route-tabs';
import { useRouteTabsStore } from '@/stores/route-tabs-store';
import { Icons } from '@/components/icons';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IconX, IconChevronDown } from '@tabler/icons-react';
import type { RouteTab } from '@/stores/route-tabs-store';

/**
 * 单个标签页项
 */
function TabItem({
  tab
}: {
  tab: {
    id: string;
    title: string;
    url: string;
    icon?: string;
    closable?: boolean;
  };
}) {
  const { switchToTab } = useRouteTabs();
  const { activeTabId, removeTab, closeOtherTabs, closeAllTabs } =
    useRouteTabsStore();
  const isActive = activeTabId === tab.id;
  const Icon = tab.icon ? Icons[tab.icon as keyof typeof Icons] : null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab.closable !== false) {
      const newActiveTabId = removeTab(tab.id);
      // 如果删除的是当前激活的标签页，需要跳转到新的激活标签页
      if (newActiveTabId && newActiveTabId !== tab.id) {
        switchToTab(newActiveTabId);
      }
    }
  };

  const handleTabClick = () => {
    switchToTab(tab.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={handleTabClick}
          className={cn(
            'group relative flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors',
            'hover:bg-muted/80',
            isActive
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {Icon && <Icon className='size-3.5 shrink-0' />}
          <span className='whitespace-nowrap'>{tab.title}</span>
          {tab.closable !== false && (
            <span
              onClick={handleClose}
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                'ml-1 rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                'hover:bg-muted inline-flex cursor-pointer items-center justify-center'
              )}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClose(e as unknown as React.MouseEvent);
                }
              }}
            >
              <IconX className='size-3' />
            </span>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            if (tab.closable !== false) {
              const newActiveTabId = removeTab(tab.id);
              if (newActiveTabId && newActiveTabId !== tab.id) {
                switchToTab(newActiveTabId);
              }
            }
          }}
          disabled={tab.closable === false}
        >
          关闭
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            closeOtherTabs(tab.id);
            switchToTab(tab.id);
          }}
          disabled={tab.closable === false}
        >
          关闭其他
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            closeAllTabs();
            const { tabs } = useRouteTabsStore.getState();
            if (tabs.length > 0) {
              switchToTab(tabs[0].id);
            }
          }}
        >
          关闭全部
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * 路由 Tabs 组件
 * 显示当前打开的路由标签页，支持切换、关闭、右键菜单
 * 用于 Header 中替换面包屑
 * 当 tabs 过多时，右侧显示下拉菜单显示隐藏的 tabs
 */
export function RouteTabs({ availableWidth = 0 }: { availableWidth?: number }) {
  const { tabs } = useRouteTabs();
  const { activeTabId } = useRouteTabsStore();
  const [mounted, setMounted] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<RouteTab[]>([]);
  const [hiddenTabs, setHiddenTabs] = useState<RouteTab[]>([]);
  const [tabWidths, setTabWidths] = useState<Map<string, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null); // 隐藏的测量容器

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useRouteTabsStore.persist.rehydrate();
  }, []);

  // 第一阶段：测量所有tab的宽度（在隐藏的测量容器中）
  const measureTabWidths = useCallback(() => {
    if (!measureContainerRef.current || tabs.length === 0) {
      return;
    }

    const measureItems = measureContainerRef.current.children;
    const widths = new Map<string, number>();

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const element = measureItems[i] as HTMLElement;
      if (!element) continue;

      const width = element.offsetWidth || element.scrollWidth;
      if (width > 0) {
        widths.set(tab.id, width);
      } else {
        // 估算值
        const titleLength = tab.title.length;
        const estimatedWidth = 14 + Math.max(titleLength * 8, 60) + 20 + 20;
        widths.set(tab.id, estimatedWidth);
      }
    }

    setTabWidths(widths);
  }, [tabs]);

  // 第二阶段：计算可见和隐藏的 tabs
  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current || tabWidths.size === 0 || tabs.length === 0) {
      // 如果还没有测量宽度，先测量
      if (tabWidths.size === 0) {
        measureTabWidths();
      }
      setVisibleTabs(tabs);
      setHiddenTabs([]);
      return;
    }

    const { activeTabId } = useRouteTabsStore.getState();
    const activeTabIndex = tabs.findIndex((t) => t.id === activeTabId);
    const centerIndex = activeTabIndex >= 0 ? activeTabIndex : 0;

    // 获取容器的实际可用宽度
    const containerRect = containerRef.current.getBoundingClientRect();
    let availableContainerWidth = containerRect.width;

    if (availableContainerWidth < 50) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        availableContainerWidth = parent.getBoundingClientRect().width;
      } else if (availableWidth > 0) {
        availableContainerWidth = availableWidth;
      } else {
        setTimeout(() => calculateVisibleTabs(), 100);
        return;
      }
    }

    const dropdownButtonWidth = 40;
    const gap = 4;

    // 计算总宽度
    let totalTabsWidth = 0;
    const widthsArray: number[] = [];
    for (let i = 0; i < tabs.length; i++) {
      const width = tabWidths.get(tabs[i].id) || 100;
      widthsArray.push(width);
      totalTabsWidth += width + (i > 0 ? gap : 0);
    }

    // 判断是否需要下拉按钮
    const needsDropdown =
      totalTabsWidth + dropdownButtonWidth + gap > availableContainerWidth;
    const tabsAvailableWidth =
      availableContainerWidth - (needsDropdown ? dropdownButtonWidth + gap : 0);

    // 计算可见tabs：从激活tab开始向两边扩展
    const visibleIndices = new Set<number>();
    let usedWidth = widthsArray[centerIndex];

    visibleIndices.add(centerIndex);

    let leftIndex = centerIndex - 1;
    let rightIndex = centerIndex + 1;

    while (leftIndex >= 0 || rightIndex < tabs.length) {
      let added = false;

      // 优先右侧
      if (rightIndex < tabs.length) {
        const rightWidth = widthsArray[rightIndex] + gap;
        if (usedWidth + rightWidth <= tabsAvailableWidth) {
          visibleIndices.add(rightIndex);
          usedWidth += rightWidth;
          rightIndex++;
          added = true;
        }
      }

      // 然后左侧
      if (leftIndex >= 0) {
        const leftWidth = widthsArray[leftIndex] + gap;
        if (usedWidth + leftWidth <= tabsAvailableWidth) {
          visibleIndices.add(leftIndex);
          usedWidth += leftWidth;
          leftIndex--;
          added = true;
        }
      }

      if (!added) break;
    }

    // 按原始顺序排序
    const sortedVisible = tabs.filter((_, index) => visibleIndices.has(index));
    const hidden = tabs.filter((_, index) => !visibleIndices.has(index));

    setVisibleTabs(sortedVisible);
    setHiddenTabs(hidden);
  }, [tabs, tabWidths, availableWidth, measureTabWidths]);

  // 防抖函数
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedCalculate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        measureTabWidths();
        setTimeout(() => {
          calculateVisibleTabs();
        }, 10);
      });
    }, 100);
  }, [measureTabWidths, calculateVisibleTabs]);

  // 监听容器尺寸变化和 tabs 变化
  useEffect(() => {
    if (!mounted) return;

    // 先测量宽度，再计算可见性
    const timeoutId = setTimeout(() => {
      measureTabWidths();
      setTimeout(() => {
        calculateVisibleTabs();
      }, 10);
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      debouncedCalculate();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [
    mounted,
    tabs,
    measureTabWidths,
    calculateVisibleTabs,
    debouncedCalculate
  ]);

  // 当激活的tab改变时，重新计算可见性
  useEffect(() => {
    if (!mounted || tabWidths.size === 0) return;
    const timeoutId = setTimeout(() => {
      calculateVisibleTabs();
    }, 50);
    return () => clearTimeout(timeoutId);
  }, [activeTabId, mounted, calculateVisibleTabs, tabWidths]);

  if (!mounted) {
    return null;
  }

  const hasOverflow = hiddenTabs.length > 0;

  return (
    <>
      {/* 隐藏的测量容器：用于测量所有tab的宽度 */}
      <div
        ref={measureContainerRef}
        className='pointer-events-none invisible absolute -z-50 flex items-center gap-1'
        aria-hidden='true'
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      >
        {tabs.map((tab) => (
          <div key={tab.id} className='shrink-0'>
            <TabItem tab={tab} />
          </div>
        ))}
      </div>

      {/* 显示容器：只渲染可见的tabs */}
      <div
        ref={containerRef}
        className='flex w-full items-center gap-1 overflow-hidden'
      >
        <div
          ref={tabsContainerRef}
          className={cn(
            'scrollbar-hide flex min-w-0 items-center gap-1',
            hasOverflow ? 'flex-1 overflow-hidden' : 'flex-1 overflow-x-auto'
          )}
        >
          {/* 只渲染可见的tabs，确保关闭按钮可以点击 */}
          {visibleTabs.map((tab) => (
            <div key={tab.id} className='shrink-0'>
              <TabItem tab={tab} />
            </div>
          ))}
        </div>
        {hasOverflow && (
          <div className='ml-1 shrink-0'>
            <OverflowDropdown tabs={hiddenTabs} />
          </div>
        )}
      </div>
    </>
  );
}

/**
 * 溢出下拉菜单组件
 * 显示隐藏的 tabs（不包含当前激活的tab）
 */
function OverflowDropdown({ tabs }: { tabs: RouteTab[] }) {
  const { switchToTab } = useRouteTabs();
  const { activeTabId } = useRouteTabsStore();

  // 过滤掉当前激活的tab（理论上不应该出现在hiddenTabs中，但为了安全）
  const filteredTabs = tabs.filter((tab) => tab.id !== activeTabId);

  if (filteredTabs.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
          <IconChevronDown className='h-4 w-4' />
          <span className='sr-only'>More tabs ({filteredTabs.length})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='max-h-[300px] overflow-y-auto'
      >
        {filteredTabs.map((tab) => {
          const Icon = tab.icon ? Icons[tab.icon as keyof typeof Icons] : null;

          return (
            <DropdownMenuItem
              key={tab.id}
              onClick={() => switchToTab(tab.id)}
              className='flex items-center gap-2'
            >
              {Icon && <Icon className='h-3.5 w-3.5' />}
              <span>{tab.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
