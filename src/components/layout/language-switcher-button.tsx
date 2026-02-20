'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LanguageSwitcherButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function LanguageSwitcherButton({
  variant = 'ghost',
  size = 'icon',
  className
}: LanguageSwitcherButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;

    // 替换 URL 中的 locale
    const segments = pathname.split('/');
    if (segments.length > 1 && locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');
    router.push(newPath);
  };

  const currentLanguageName = t(locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('h-9 w-9', className)}
          title={t('selectLanguage')}
        >
          <Icons.language className='h-4 w-4' />
          <span className='sr-only'>{t('selectLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={cn(
              'cursor-pointer',
              locale === loc && 'bg-accent font-medium'
            )}
          >
            <span className='mr-2'>{t(loc)}</span>
            {locale === loc && <Icons.check className='ml-auto h-4 w-4' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
