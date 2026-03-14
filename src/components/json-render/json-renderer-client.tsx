'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider
} from '@json-render/react';
import { registry } from '@/lib/json-render/registry';
import { catalog } from '@/lib/json-render/catalog';
import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { createSpecStreamCompiler } from '@json-render/core';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { JsonRenderErrorBoundary } from './error-boundary';

interface JsonRendererClientProps {
  initialPrompt?: string;
}

/**
 * json-render UI 渲染组件（客户端版本）
 * 直接在客户端调用 AI，不使用服务端 API
 * 支持流式渲染、数据绑定、条件可见性和行为事件处理
 */
export function JsonRendererClient({ initialPrompt }: JsonRendererClientProps) {
  const router = useRouter();
  const [spec, setSpec] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 客户端 AI 调用函数
  const send = async (prompt: string) => {
    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsStreaming(true);
      setError(null);
      setSpec(null);

      // 创建新的 AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 生成 system prompt
      const systemPrompt = catalog.prompt();

      // 配置 Ollama 提供者
      // 注意：Ollama 需要运行在客户端可访问的地址
      // 如果 Ollama 运行在 localhost，需要确保客户端可以访问
      const baseURL =
        process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11434/api';
      const ollama = createOllama({
        baseURL,
        headers: process.env.NEXT_PUBLIC_OLLAMA_API_KEY
          ? {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OLLAMA_API_KEY}`
            }
          : undefined
      });

      // 配置模型（默认：glm-5:cloud）
      const modelName = process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'glm-5:cloud';
      const model = ollama(modelName);

      // 生成流式响应
      const result = streamText({
        model,
        system: systemPrompt,
        prompt,
        abortSignal: abortController.signal
      });

      // 创建流编译器
      const compiler = createSpecStreamCompiler<any>();

      // 处理流式响应
      let buffer = '';
      for await (const chunk of result.textStream) {
        if (abortController.signal.aborted) {
          break;
        }

        buffer += chunk;

        // 按行分割（JSONL 格式）
        const lines = buffer.split('\n');
        // 保留最后一个不完整的行
        buffer = lines.pop() || '';

        // 处理完整的行
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            try {
              const { result: newSpec, newPatches } = compiler.push(
                trimmedLine + '\n'
              );
              if (newPatches.length > 0) {
                // 更新 UI 以显示部分结果
                setSpec(newSpec);
              }
            } catch (err) {
              // 忽略单个行的解析错误，继续处理下一行
              console.warn('Failed to parse line:', trimmedLine, err);
            }
          }
        }
      }

      // 处理剩余的 buffer
      if (buffer.trim()) {
        try {
          const { result: finalSpec } = compiler.push(buffer);
          setSpec(finalSpec);
        } catch (err) {
          console.warn('Failed to parse final buffer:', err);
        }
      }

      // 获取最终结果
      const finalSpec = compiler.getResult();
      if (finalSpec && Object.keys(finalSpec).length > 0) {
        setSpec(finalSpec);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 请求被取消，不需要显示错误
        return;
      }
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error generating UI:', error);
      toast.error('生成 UI 时出错', {
        description: error.message
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // 如果有初始 prompt，自动发送
  useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // 清理函数：组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
        toast.info(`打开对话框: ${dialogId}`);
      }
    },
    closeDialog: (params: Record<string, unknown>) => {
      const dialogId = params.dialogId as string;
      if (typeof dialogId === 'string') {
        console.log('Closing dialog:', dialogId);
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
