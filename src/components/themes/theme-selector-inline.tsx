'use client';

import { useThemeConfig } from '@/components/themes/active-theme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { Icons } from '../icons';
import { THEMES } from './theme.config';

interface ThemeSelectorInlineProps {
  align?: 'start' | 'end';
}

/**
 * 内联主题选择器组件
 * 用于设置面板等场景，支持自定义对齐方式
 */
export function ThemeSelectorInline({
  align = 'start'
}: ThemeSelectorInlineProps) {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='w-full justify-start'>
          <Icons.palette className='mr-2 h-4 w-4' />
          <span>
            {THEMES.find((t) => t.value === activeTheme)?.name || '选择主题'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className='w-56'>
        <DropdownMenuLabel>主题</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setActiveTheme(theme.value)}
            className={activeTheme === theme.value ? 'bg-accent' : ''}
          >
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
