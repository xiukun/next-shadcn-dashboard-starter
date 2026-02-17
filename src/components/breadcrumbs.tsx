'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { useUserPreferencesStore } from '@/stores/user-preferences-store';
import { IconSlash } from '@tabler/icons-react';
import { Fragment, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  const { enableTabs, showBreadcrumbs, breadcrumbStyle } =
    useUserPreferencesStore();
  const [mounted, setMounted] = useState(false);

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useUserPreferencesStore.persist.rehydrate();
  }, []);

  // 如果标签栏启用，或面包屑被禁用，或不满足显示条件，不渲染
  if (!mounted || enableTabs || !showBreadcrumbs || items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList
        className={cn(
          breadcrumbStyle === 'background' &&
            'bg-muted/50 rounded-md px-3 py-1.5'
        )}
      >
        {items.map((item, index) => (
          <Fragment key={item.title}>
            {index !== items.length - 1 && (
              <BreadcrumbItem className='hidden md:block'>
                <BreadcrumbLink href={item.link}>{item.title}</BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {index < items.length - 1 && (
              <BreadcrumbSeparator className='hidden md:block'>
                <IconSlash />
              </BreadcrumbSeparator>
            )}
            {index === items.length - 1 && (
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
