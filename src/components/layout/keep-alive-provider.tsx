'use client';

import React, {
  Fragment,
  PropsWithChildren,
  useEffect,
  useRef,
  useState
} from 'react';
import { usePathname } from 'next/navigation';
import { useUserPreferencesStore } from '@/stores/user-preferences-store';
import { useRouteTabsStore } from '@/stores/route-tabs-store';
import KeepAliveRoute from './keep-alive-route';

/**
 * Keep-Alive Provider（简化版）
 *
 * - 不需要页面侧 KeepAliveSign
 * - 在 Provider 内缓存 `children`（按 pathname 分组）并保持挂载
 * - 通过 KeepAliveRoute 把当前激活页面的 DOM 挂到容器内，非激活页面从 DOM 中移除但保持在内存中
 */
const KeepAliveProvider = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const { enableKeepAlive } = useUserPreferencesStore();
  const { tabs } = useRouteTabsStore();

  const cache = useRef<Map<string, React.ReactNode>>(new Map());
  const [mounted, setMounted] = useState(false);
  const aliveParentRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  // 确保在客户端 hydration 完成后再执行缓存逻辑
  useEffect(() => {
    setMounted(true);
  }, []);

  // keep-alive 关闭时清空缓存
  useEffect(() => {
    if (!mounted) return;
    if (!enableKeepAlive) {
      cache.current.clear();
      forceUpdate((x) => x + 1);
    }
  }, [mounted, enableKeepAlive]);

  // 如果未启用 Keep-Alive 或未挂载，直接渲染 children（不进行任何缓存处理）
  if (!enableKeepAlive || !mounted) {
    return <>{children}</>;
  }

  // 创建当前路由缓存（只缓存 dashboard 路由，避免污染）
  if (pathname.startsWith('/dashboard') && !cache.current.has(pathname)) {
    cache.current.set(pathname, <Fragment key={pathname}>{children}</Fragment>);
  }

  // tabs 有值时用于清理缓存（关闭 tab 后释放）
  if (tabs.length > 0) {
    // 注意：tabs.url 现在可能包含 query 参数，keep-alive 缓存 key 使用 pathname（不含 query）
    // 所以这里必须用 tabs.id（纯 pathname）来判断是否仍打开
    const tabSet = new Set(tabs.map((t) => t.id));
    const keysToDelete: string[] = [];
    cache.current.forEach((_, key) => {
      if (!tabSet.has(key) && key !== pathname) keysToDelete.push(key);
    });
    keysToDelete.forEach((k) => cache.current.delete(k));
  }

  return (
    <div
      ref={aliveParentRef}
      className='flex min-h-0 flex-1 flex-col'
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* 安全兜底：如果未缓存（极少数边界），直接渲染 */}
      {!cache.current.has(pathname) && children}

      {Array.from(cache.current.entries()).map(([key, node]) => (
        <KeepAliveRoute
          key={key}
          parentDomRef={aliveParentRef}
          activeKey={pathname}
          pageKey={key}
        >
          {node}
        </KeepAliveRoute>
      ))}
    </div>
  );
};

export default KeepAliveProvider;
