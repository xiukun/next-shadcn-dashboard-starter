'use client';

import { useFullscreenStore } from '@/stores/fullscreen-store';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 全屏布局组件
 * 根据全屏状态条件渲染完整布局或全屏布局（保留 Header，隐藏侧边栏）
 */
export function FullscreenLayout({
  fullLayout,
  fullscreenLayout
}: {
  fullLayout: ReactNode;
  fullscreenLayout: ReactNode;
}) {
  const { isFullscreen } = useFullscreenStore();

  // 如果全屏，显示全屏布局（保留 Header，隐藏侧边栏）
  if (isFullscreen) {
    return (
      <div
        className={cn(
          'bg-background fixed inset-0 z-50 flex flex-col',
          'transition-all duration-200'
        )}
      >
        {fullscreenLayout}
      </div>
    );
  }

  // 正常模式：显示完整布局
  return <>{fullLayout}</>;
}
