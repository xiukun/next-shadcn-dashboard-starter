'use client';

import React from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider,
  useUIStream
} from '@json-render/react';
import { registry } from '@/lib/json-render/registry';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { JsonRenderErrorBoundary } from './error-boundary';

interface JsonRendererProps {
  api?: string;
  initialPrompt?: string;
}

/**
 * json-render UI 渲染组件
 * 支持流式渲染、数据绑定、条件可见性和行为事件处理
 */
export function JsonRenderer({
  api = '/api/generate-ui',
  initialPrompt
}: JsonRendererProps) {
  const router = useRouter();
  const { spec, isStreaming, send, error } = useUIStream({
    api
  });

  // 如果有初始 prompt，自动发送
  React.useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt);
    }
  }, [initialPrompt, send]);

  // Action handlers
  const actionHandlers = {
    submit: (params: Record<string, unknown>) => {
      const formId = params.formId as string | undefined;
      const data = params.data as Record<string, unknown> | undefined;
      console.log('Form submitted:', { formId, data });
      toast.success('表单已提交', {
        description: formId ? `表单 ID: ${formId}` : undefined
      });
    },
    navigate: (params: Record<string, unknown>) => {
      const url = params.url as string;
      if (typeof url === 'string') {
        console.log('Navigating to:', url);
        router.push(url);
      }
    },
    showToast: (params: Record<string, unknown>) => {
      const message = params.message as string;
      const type =
        (params.type as 'success' | 'error' | 'info' | 'warning') || 'info';
      const duration = params.duration as number | undefined;
      if (typeof message === 'string') {
        switch (type) {
          case 'success':
            toast.success(message, { duration });
            break;
          case 'error':
            toast.error(message, { duration });
            break;
          case 'warning':
            toast.warning(message, { duration });
            break;
          default:
            toast.info(message, { duration });
        }
      }
    },
    openDialog: (params: Record<string, unknown>) => {
      const dialogId = params.dialogId as string;
      if (typeof dialogId === 'string') {
        console.log('Opening dialog:', dialogId);
        // 这里可以实现对话框打开逻辑
        toast.info(`打开对话框: ${dialogId}`);
      }
    },
    closeDialog: (params: Record<string, unknown>) => {
      const dialogId = params.dialogId as string;
      if (typeof dialogId === 'string') {
        console.log('Closing dialog:', dialogId);
        // 这里可以实现对话框关闭逻辑
        toast.info(`关闭对话框: ${dialogId}`);
      }
    }
  };

  return (
    <JsonRenderErrorBoundary>
      <StateProvider initialState={{}}>
        <VisibilityProvider>
          <ActionProvider handlers={actionHandlers}>
            <ValidationProvider customFunctions={{}}>
              {error && (
                <div className='border-destructive bg-destructive/10 text-destructive rounded-lg border p-4'>
                  <p className='font-medium'>生成 UI 时出错</p>
                  <p className='text-sm'>{error.message || '未知错误'}</p>
                </div>
              )}
              <Renderer spec={spec} registry={registry} loading={isStreaming} />
            </ValidationProvider>
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </JsonRenderErrorBoundary>
  );
}
