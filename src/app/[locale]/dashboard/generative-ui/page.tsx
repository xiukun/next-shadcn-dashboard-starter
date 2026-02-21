'use client';

import React, { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { JsonRendererClient } from '@/components/json-render/json-renderer-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useTranslations } from 'next-intl';

const EXAMPLE_PROMPTS = [
  '创建一个登录表单，包含用户名和密码输入框，以及登录按钮',
  '显示一个数据仪表板，包含标题、三个指标卡片和一个图表',
  '创建一个用户注册表单，包含姓名、邮箱、密码和确认密码字段',
  '显示一个产品卡片列表，每个卡片包含图片、标题、描述和价格'
];

export default function GenerativeUIPage() {
  const t = useTranslations('json-render');
  const [prompt, setPrompt] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (prompt.trim()) {
      setCurrentPrompt(prompt.trim());
      setPrompt('');
    }
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <PageContainer
      scrollable={true}
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
    >
      <div className='space-y-6'>
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('inputTitle')}</CardTitle>
            <CardDescription>{t('inputDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('inputPlaceholder')}
                rows={4}
                className='resize-none'
              />
              <div className='flex items-center justify-between'>
                <Button type='submit' disabled={!prompt.trim()}>
                  {t('generateButton')}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setPrompt('');
                    setCurrentPrompt(undefined);
                  }}
                >
                  {t('clearButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 示例提示 */}
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>{t('examplesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-2 sm:grid-cols-2'>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Button
                  key={index}
                  variant='outline'
                  className='h-auto justify-start text-left'
                  onClick={() => handleExampleClick(example)}
                >
                  <span className='text-sm'>{example}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 渲染区域 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('outputTitle')}</CardTitle>
            <CardDescription>{t('outputDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentPrompt ? (
              <JsonRendererClient initialPrompt={currentPrompt} />
            ) : (
              <div className='text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed'>
                <p>{t('emptyState')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
