import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import { DEFAULT_THEME } from '@/components/themes/theme.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '@/styles/globals.css';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b'
};

export const metadata: Metadata = {
  title: 'Next Shadcn',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // 获取主题配置
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const themeToApply = activeThemeValue || DEFAULT_THEME;

  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Set initial theme to prevent flash
                const theme = '${themeToApply}';
                if (theme) {
                  document.documentElement.setAttribute('data-theme', theme);
                }
                // Set meta theme color
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
              
              // 捕获并忽略 Next.js 16 + React 19 的性能测量错误
              // 这是一个已知的 bug (https://github.com/vercel/next.js/issues/20743)
              // 不影响应用功能，只是开发环境下的警告
              if (typeof window !== 'undefined') {
                // 捕获 performance.measure 错误
                const originalMeasure = performance.measure;
                performance.measure = function(name, startMark, endMark) {
                  try {
                    return originalMeasure.call(this, name, startMark, endMark);
                  } catch (error) {
                    // 忽略 "RootNotFound cannot have negative time stamp" 错误
                    if (
                      error instanceof Error &&
                      (error.message.includes('RootNotFound') ||
                       error.message.includes('negative time stamp') ||
                       error.message.includes('Failed to execute'))
                    ) {
                      return null;
                    }
                    throw error;
                  }
                };
                
                // 同时捕获控制台错误
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args[0];
                  if (
                    typeof message === 'string' &&
                    (message.includes('Failed to execute') && message.includes('measure') && message.includes('Performance')) ||
                    message.includes('RootNotFound') ||
                    message.includes('cannot have a negative time stamp')
                  ) {
                    // 静默忽略这个错误
                    return;
                  }
                  originalError.apply(console, args);
                };
              }
            `
          }}
        />
      </head>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            <Providers activeThemeValue={themeToApply}>
              <Toaster />
              {children}
            </Providers>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
