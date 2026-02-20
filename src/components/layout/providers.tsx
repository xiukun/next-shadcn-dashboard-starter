'use client';
import React, { useEffect, useRef } from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { AuthProvider } from '@/components/auth/auth-context';
import { useRouteTabsStore } from '@/stores/route-tabs-store';
import { usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const resetTabs = useRouteTabsStore((state) => state.resetTabs);
  const pathname = usePathname();
  const lastLocaleRef = useRef<string | null>(null);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const localeCandidate = segments[0];
    const nextLocale = routing.locales.includes(localeCandidate as any)
      ? localeCandidate
      : routing.defaultLocale;
    if (lastLocaleRef.current === null) {
      lastLocaleRef.current = nextLocale;
      return;
    }
    if (lastLocaleRef.current !== nextLocale) {
      lastLocaleRef.current = nextLocale;
      resetTabs();
    }
  }, [pathname, resetTabs]);

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </ActiveThemeProvider>
    </>
  );
}
