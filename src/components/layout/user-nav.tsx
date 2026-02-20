'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useAuthContext } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
export function UserNav() {
  const { user, logout } = useAuthContext();
  const router = useRouter();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <UserAvatarProfile
              user={{
                imageUrl: user.avatarUrl,
                fullName: user.name,
                emailAddresses: [{ emailAddress: user.email }]
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>{user.name}</p>
              <p className='text-muted-foreground text-xs leading-none'>
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/dashboard/profile`)}
            >
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/dashboard/billing`)}
            >
              {t('billing')}
            </DropdownMenuItem>
            <DropdownMenuItem>{tCommon('settings')}</DropdownMenuItem>
            <DropdownMenuItem>{tCommon('newTeam')}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await logout();
              router.push(`/${locale}/auth/sign-in`);
            }}
          >
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
