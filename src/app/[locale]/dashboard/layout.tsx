import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import KeepAliveProvider from '@/components/layout/keep-alive-provider';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { FullscreenLayout } from '@/components/layout/fullscreen-layout';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const fullLayout = (
    <SidebarProvider defaultOpen={defaultOpen}>
      <InfobarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* page main content */}
          <KeepAliveProvider>{children}</KeepAliveProvider>
          {/* page main content ends */}
        </SidebarInset>
        <InfoSidebar side='right' />
      </InfobarProvider>
    </SidebarProvider>
  );

  // 全屏模式下的布局：保留 Header，隐藏侧边栏
  // 注意：仍然需要 SidebarProvider 因为 Header 中的 SidebarTrigger 需要它
  const fullscreenLayout = (
    <SidebarProvider defaultOpen={false}>
      <InfobarProvider defaultOpen={false}>
        {/* 隐藏侧边栏，但保留 SidebarProvider 上下文 */}
        <div className='hidden'>
          <AppSidebar />
        </div>
        <div className='flex min-w-0 flex-1 flex-col'>
          <Header />
          {/* page main content */}
          <div className='flex-1 overflow-auto'>
            <KeepAliveProvider>{children}</KeepAliveProvider>
          </div>
          {/* page main content ends */}
        </div>
      </InfobarProvider>
    </SidebarProvider>
  );

  return (
    <KBar>
      <FullscreenLayout
        fullLayout={fullLayout}
        fullscreenLayout={fullscreenLayout}
      />
    </KBar>
  );
}
