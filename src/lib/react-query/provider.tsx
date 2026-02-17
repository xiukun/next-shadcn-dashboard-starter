/**
 * React Query Provider 组件
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createQueryClient } from './config';

export function ReactQueryProvider({
  children
}: {
  children: React.ReactNode;
}) {
  // 使用 useState 确保 QueryClient 在客户端只创建一次
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
