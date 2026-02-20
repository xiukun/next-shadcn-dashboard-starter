'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUserPreferencesStore } from '@/stores/user-preferences-store';
import { ThemeSelectorInline } from '@/components/themes/theme-selector-inline';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { LanguageSwitcher } from './language-switcher';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 设置面板组件
 * 提供用户偏好设置界面，包括布局和外观两个标签页
 */
export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const [mounted, setMounted] = useState(false);
  const {
    enableTabs,
    showBreadcrumbs,
    breadcrumbStyle,
    sidebarCollapseMode,
    enableKeepAlive,
    setEnableTabs,
    setShowBreadcrumbs,
    setBreadcrumbStyle,
    setSidebarCollapseMode,
    setEnableKeepAlive
  } = useUserPreferencesStore();
  const t = useTranslations('settings');
  const tLanguage = useTranslations('language');

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useUserPreferencesStore.persist.rehydrate();
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='layout' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='layout'>{t('layout')}</TabsTrigger>
            <TabsTrigger value='appearance'>{t('appearance')}</TabsTrigger>
          </TabsList>

          {/* 布局标签页 */}
          <TabsContent value='layout' className='mt-6 space-y-6'>
            {/* 侧边栏相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>{t('sidebar')}</h3>
              </div>

              <div className='space-y-2'>
                <Label>{t('collapseEffect')}</Label>
                <p className='text-muted-foreground text-sm'>
                  {t('collapseEffectDescription')}
                </p>
                <RadioGroup
                  value={sidebarCollapseMode}
                  onValueChange={(value) =>
                    setSidebarCollapseMode(value as 'icon' | 'expanded-submenu')
                  }
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='icon' id='icon-mode' />
                    <Label
                      htmlFor='icon-mode'
                      className='cursor-pointer font-normal'
                    >
                      {t('iconMode')}
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem
                      value='expanded-submenu'
                      id='expanded-submenu-mode'
                    />
                    <Label
                      htmlFor='expanded-submenu-mode'
                      className='cursor-pointer font-normal'
                    >
                      {t('expandedSubmenuMode')}
                    </Label>
                  </div>
                </RadioGroup>
                <p className='text-muted-foreground text-xs'>
                  {t('iconModeDescription')}
                  <br />
                  {t('expandedSubmenuModeDescription')}
                </p>
              </div>
            </div>

            <Separator />

            {/* 面包屑相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>{t('breadcrumbs')}</h3>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='show-breadcrumbs'>
                    {t('showBreadcrumbs')}
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('showBreadcrumbsDescription')}
                  </p>
                </div>
                <Switch
                  id='show-breadcrumbs'
                  checked={showBreadcrumbs}
                  onCheckedChange={setShowBreadcrumbs}
                  disabled={enableTabs}
                />
              </div>

              <div className='space-y-2'>
                <Label>{t('breadcrumbStyle')}</Label>
                <RadioGroup
                  value={breadcrumbStyle}
                  onValueChange={(value) =>
                    setBreadcrumbStyle(value as 'regular' | 'background')
                  }
                  disabled={enableTabs}
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='regular' id='regular' />
                    <Label
                      htmlFor='regular'
                      className='cursor-pointer font-normal'
                    >
                      {t('regular')}
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='background' id='background' />
                    <Label
                      htmlFor='background'
                      className='cursor-pointer font-normal'
                    >
                      {t('background')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Separator />

            {/* 标签栏相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>{t('tabs')}</h3>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='enable-tabs'>{t('enableTabs')}</Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('enableTabsDescription')}
                  </p>
                </div>
                <Switch
                  id='enable-tabs'
                  checked={enableTabs}
                  onCheckedChange={setEnableTabs}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='enable-keepalive'>
                    {t('enableKeepAlive')}
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('enableKeepAliveDescription')}
                  </p>
                </div>
                <Switch
                  id='enable-keepalive'
                  checked={enableKeepAlive}
                  onCheckedChange={setEnableKeepAlive}
                  disabled={!enableTabs}
                />
              </div>
            </div>
          </TabsContent>

          {/* 外观标签页 */}
          <TabsContent value='appearance' className='mt-6 space-y-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>{t('theme')}</h3>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>{t('themeMode')}</Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('themeModeDescription')}
                  </p>
                  <div className='flex items-center'>
                    <ThemeModeToggle />
                  </div>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Label>{t('themeColor')}</Label>
                  <p className='text-muted-foreground text-sm'>
                    {t('themeColorDescription')}
                  </p>
                  <ThemeSelectorInline align='start' />
                </div>

                <Separator />

                {/* 语言设置 */}
                <div className='space-y-2'>
                  <Label>{tLanguage('language')}</Label>
                  <p className='text-muted-foreground text-sm'>
                    {tLanguage('selectLanguage')}
                  </p>
                  <div className='flex items-center'>
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
