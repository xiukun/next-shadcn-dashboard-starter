'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { AuthProvider } from '@/components/auth/auth-context';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
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
