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
import { useUserPreferencesStore } from '@/lib/user-preferences-store';
import { ThemeSelectorInline } from '@/components/themes/theme-selector-inline';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { Separator } from '@/components/ui/separator';

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
    setEnableTabs,
    setShowBreadcrumbs,
    setBreadcrumbStyle,
    setSidebarCollapseMode
  } = useUserPreferencesStore();

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
          <DialogTitle>偏好设置</DialogTitle>
          <DialogDescription>自定义偏好设置 & 实时预览</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='layout' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='layout'>布局</TabsTrigger>
            <TabsTrigger value='appearance'>外观</TabsTrigger>
          </TabsList>

          {/* 布局标签页 */}
          <TabsContent value='layout' className='mt-6 space-y-6'>
            {/* 侧边栏相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>侧边栏</h3>
              </div>

              <div className='space-y-2'>
                <Label>折叠效果</Label>
                <p className='text-muted-foreground text-sm'>
                  选择侧边栏折叠时的显示方式
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
                      图标模式
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
                      展开子项模式
                    </Label>
                  </div>
                </RadioGroup>
                <p className='text-muted-foreground text-xs'>
                  图标模式：折叠时只显示图标，点击展开子菜单
                  <br />
                  展开子项模式：折叠时显示图标和所有子菜单项
                </p>
              </div>
            </div>

            <Separator />

            {/* 面包屑相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>面包屑</h3>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='show-breadcrumbs'>显示面包屑</Label>
                  <p className='text-muted-foreground text-sm'>
                    当标签栏关闭时显示面包屑导航
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
                <Label>面包屑风格</Label>
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
                      常规
                    </Label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='background' id='background' />
                    <Label
                      htmlFor='background'
                      className='cursor-pointer font-normal'
                    >
                      背景
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <Separator />

            {/* 标签栏相关设置 */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>标签栏</h3>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='enable-tabs'>启用标签栏</Label>
                  <p className='text-muted-foreground text-sm'>
                    启用多标签页导航，关闭则显示面包屑
                  </p>
                </div>
                <Switch
                  id='enable-tabs'
                  checked={enableTabs}
                  onCheckedChange={setEnableTabs}
                />
              </div>
            </div>
          </TabsContent>

          {/* 外观标签页 */}
          <TabsContent value='appearance' className='mt-6 space-y-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>主题</h3>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>主题模式</Label>
                  <p className='text-muted-foreground text-sm'>切换明暗主题</p>
                  <div className='flex items-center'>
                    <ThemeModeToggle />
                  </div>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Label>主题颜色</Label>
                  <p className='text-muted-foreground text-sm'>
                    选择应用主题配色方案
                  </p>
                  <ThemeSelectorInline align='start' />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
