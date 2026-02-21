'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 错误边界组件
 * 捕获 json-render 渲染过程中的错误
 */
export class JsonRenderErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('JsonRender Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>渲染错误</AlertTitle>
          <AlertDescription>
            {this.state.error?.message || '生成 UI 时发生错误'}
            <br />
            <span className='text-muted-foreground text-xs'>
              请检查 AI 生成的 JSON spec 是否有效
            </span>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
