'use client';

import * as React from 'react';

/**
 * ClientOnly 组件
 * 用于包装需要在客户端 hydration 完成后再渲染的组件
 * 这可以避免 SSR hydration 错误，特别是对于使用动态 ID 的组件（如 Radix UI）
 */
export function ClientOnly({
  children,
  fallback = null
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
